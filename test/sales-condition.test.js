const cds = require('@sap/cds');

const MOCK_RECORDS = [
  {
    ConditionRecord: 'CR001',
    ConditionSequentialNumber: '01',
    ConditionTable: '304',
    ConditionType: 'PCP0',
    ConditionValidityStartDate: '2024-01-01',
    ConditionValidityEndDate: '2024-12-31',
    ConditionRateValue: 100.0,
    ConditionRateValueUnit: 'EUR',
    WorkAgreement: 'WA-0001',
    Customer: 'CUST01',
  },
  {
    ConditionRecord: 'CR002',
    ConditionSequentialNumber: '01',
    ConditionTable: '304',
    ConditionType: 'PCP0',
    ConditionValidityStartDate: '2024-03-01',
    ConditionValidityEndDate: '2024-12-31',
    ConditionRateValue: 200.0,
    ConditionRateValueUnit: 'USD',
    WorkAgreement: 'WA-0002',
    Customer: 'CUST02',
  },
  {
    ConditionRecord: 'CR003',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PR00',
    ConditionValidityStartDate: '2024-01-01',
    ConditionValidityEndDate: '2024-12-31',
    ConditionRateValue: 50.0,
    ConditionRateValueUnit: 'EUR',
    WorkAgreement: 'WA-0001',
    Customer: 'CUST01',
  },
];

function matchesWhere(record, where) {
  let i = 0;
  while (i < where.length) {
    if (where[i] === 'and') { i++; continue; }
    const left = where[i];
    const op = where[i + 1];
    const right = where[i + 2];
    if (left?.ref && op === '=' && right?.val !== undefined) {
      const field = left.ref[0];
      if (record[field] !== right.val) return false;
    }
    i += 3;
  }
  return true;
}

// Mock the external service before cds.test() boots the server
const mockService = {
  entities: {
    A_SlsPrcgConditionRecord: 'A_SlsPrcgConditionRecord',
  },
  run: jest.fn(async (query) => {
    const where = query?.SELECT?.where;
    if (!where) return [...MOCK_RECORDS];
    return MOCK_RECORDS.filter((r) => matchesWhere(r, where));
  }),
};

const originalConnect = cds.connect.to.bind(cds.connect);
jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
  if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockService;
  return originalConnect(name);
});

describe('SalesConditionService', () => {
  const test = cds.test(__dirname + '/..');

  it('returns records filtered by worker ID only', async () => {
    const { data } = await test.axios.get(
      '/odata/v4/sales-condition/getConditionRecords(workerId=\'10001\',customer=null)'
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR001');
    expect(data.value[0].ConditionType).toBe('PCP0');
  });

  it('returns records filtered by customer only', async () => {
    const { data } = await test.axios.get(
      '/odata/v4/sales-condition/getConditionRecords(workerId=null,customer=\'CUST02\')'
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR002');
  });

  it('returns records filtered by both worker ID and customer', async () => {
    const { data } = await test.axios.get(
      '/odata/v4/sales-condition/getConditionRecords(workerId=\'10001\',customer=\'CUST01\')'
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR001');
  });

  it('returns 400 when neither filter is provided', async () => {
    try {
      await test.axios.get(
        '/odata/v4/sales-condition/getConditionRecords(workerId=null,customer=null)'
      );
      fail('Expected request to fail');
    } catch (e) {
      expect(e.response.status).toBe(400);
    }
  });

  it('returns 404 for unknown worker ID', async () => {
    try {
      await test.axios.get(
        '/odata/v4/sales-condition/getConditionRecords(workerId=\'99999\',customer=null)'
      );
      fail('Expected request to fail');
    } catch (e) {
      expect(e.response.status).toBe(404);
    }
  });

  it('returns empty array when no records match', async () => {
    const { data } = await test.axios.get(
      '/odata/v4/sales-condition/getConditionRecords(workerId=\'10003\',customer=null)'
    );
    expect(data.value).toEqual([]);
  });
});
