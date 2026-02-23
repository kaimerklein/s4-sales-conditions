const cds = require('@sap/cds');

const MOCK_VALIDITY_RECORDS = [
  {
    ConditionRecord: 'CR001',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: 'PRJ001',
  },
  {
    ConditionRecord: 'CR002',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-03-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0002',
    Customer: 'CUST02',
    EngagementProject: '',
  },
  {
    ConditionRecord: 'CR003',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PR00',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: '',
  },
];

const MOCK_CONDITION_RECORDS = [
  {
    ConditionRecord: 'CR001',
    ConditionSequentialNumber: '01',
    ConditionTable: '304',
    ConditionType: 'PCP0',
    ConditionRateValue: 100.0,
    ConditionRateValueUnit: 'EUR',
    ConditionCurrency: 'EUR',
  },
  {
    ConditionRecord: 'CR002',
    ConditionSequentialNumber: '01',
    ConditionTable: '304',
    ConditionType: 'PCP0',
    ConditionRateValue: 200.0,
    ConditionRateValueUnit: 'USD',
    ConditionCurrency: 'USD',
  },
  {
    ConditionRecord: 'CR003',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PR00',
    ConditionRateValue: 50.0,
    ConditionRateValueUnit: 'EUR',
    ConditionCurrency: 'EUR',
  },
];

// Worker mapping fixture: worker 10001 -> WA-0001, worker 10003 -> WA-0003
const WORKER_FIXTURE = [
  {
    PersonWorkAgreement: 'WA-0001',
    PersonWorkAgreementExternalID: '10001',
    CompanyCode: '1000',
    CompanyCodeName: 'ACME Corp',
    Company: 'AC',
    StartDate: '2024-01-01',
    EndDate: '2024-12-31',
  },
  {
    PersonWorkAgreement: 'WA-0003',
    PersonWorkAgreementExternalID: '10003',
    CompanyCode: '3000',
    CompanyCodeName: 'Gamma GmbH',
    Company: 'GG',
    StartDate: '2023-06-01',
    EndDate: '2024-05-31',
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
    if (left?.ref && op === 'in' && Array.isArray(right?.list)) {
      const field = left.ref[0];
      const vals = right.list.map(x => x.val);
      if (!vals.includes(record[field])) return false;
    }
    i += 3;
  }
  return true;
}

// Mock the external services before cds.test() boots the server
const mockConditionService = {
  entities: {
    A_SlsPrcgCndnRecdValidity: 'A_SlsPrcgCndnRecdValidity',
    A_SlsPrcgConditionRecord: 'A_SlsPrcgConditionRecord',
  },
  run: jest.fn(async (query) => {
    const from = query?.SELECT?.from?.ref?.[0] || query?.SELECT?.from;
    const where = query?.SELECT?.where;
    if (from === 'A_SlsPrcgConditionRecord') {
      if (!where) return [...MOCK_CONDITION_RECORDS];
      return MOCK_CONDITION_RECORDS.filter((r) => matchesWhere(r, where));
    }
    if (!where) return [...MOCK_VALIDITY_RECORDS];
    return MOCK_VALIDITY_RECORDS.filter((r) => matchesWhere(r, where));
  }),
};

const mockWorkerService = {
  entities: {
    YY1_RSM_WORKAGRMNT_VAL_IE: 'YY1_RSM_WORKAGRMNT_VAL_IE',
  },
  run: jest.fn(async (query) => {
    const where = query?.SELECT?.where;
    if (!where) return [...WORKER_FIXTURE];
    return WORKER_FIXTURE.filter((r) => matchesWhere(r, where));
  }),
};

const originalConnect = cds.connect.to.bind(cds.connect);
jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
  if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockConditionService;
  if (name === 'YY1_RSM_WORKAGRMNT_VAL_IE_CDS') return mockWorkerService;
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
    expect(data.value[0].Personnel).toBe('WA-0001');
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
