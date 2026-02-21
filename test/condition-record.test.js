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

/**
 * Simple matcher for CDS-style WHERE clause arrays against a record object.
 * Handles flat conjunctions: [{ref}, '=', {val}, 'and', {ref}, '=', {val}, ...]
 */
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

describe('condition-record lib', () => {
  let getConditionRecords;

  beforeAll(() => {
    // Create a mock service object with entities and run method
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

    // Override cds.connect.to to return our mock
    const originalConnect = cds.connect.to.bind(cds.connect);
    jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
      if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockService;
      return originalConnect(name);
    });

    getConditionRecords = require('../srv/lib/condition-record').getConditionRecords;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('filters by workAgreementId and returns only PCP0 records', async () => {
    const results = await getConditionRecords({ workAgreementId: 'WA-0001' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
    expect(results[0].ConditionType).toBe('PCP0');
  });

  it('filters by customer and returns only PCP0 records', async () => {
    const results = await getConditionRecords({ customer: 'CUST02' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR002');
  });

  it('filters by both workAgreementId and customer', async () => {
    const results = await getConditionRecords({
      workAgreementId: 'WA-0001',
      customer: 'CUST01',
    });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
  });

  it('throws when neither filter is provided', async () => {
    await expect(getConditionRecords({})).rejects.toThrow(
      'At least one filter is required'
    );
  });

  it('throws when called without arguments', async () => {
    await expect(getConditionRecords()).rejects.toThrow(
      'At least one filter is required'
    );
  });

  it('returns empty array when no records match', async () => {
    const results = await getConditionRecords({ workAgreementId: 'WA-9999' });
    expect(results).toEqual([]);
  });
});
