const cds = require('@sap/cds');

// Mock validity records with nested to_SlsPrcgConditionRecord
const MOCK_VALIDITY_RECORDS = [
  {
    ConditionRecord: 'CR001',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: 'PRJ001',
    to_SlsPrcgConditionRecord: {
      ConditionRecord: 'CR001',
      ConditionSequentialNumber: '01',
      ConditionTable: '304',
      ConditionType: 'PCP0',
      ConditionRateValue: 100.0,
      ConditionRateValueUnit: 'EUR',
      ConditionCurrency: 'EUR',
    },
  },
  {
    ConditionRecord: 'CR002',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-03-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0002',
    Customer: 'CUST02',
    EngagementProject: '',
    to_SlsPrcgConditionRecord: {
      ConditionRecord: 'CR002',
      ConditionSequentialNumber: '01',
      ConditionTable: '304',
      ConditionType: 'PCP0',
      ConditionRateValue: 200.0,
      ConditionRateValueUnit: 'USD',
      ConditionCurrency: 'USD',
    },
  },
  {
    ConditionRecord: 'CR003',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PR00',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: '',
    to_SlsPrcgConditionRecord: {
      ConditionRecord: 'CR003',
      ConditionSequentialNumber: '01',
      ConditionTable: '305',
      ConditionType: 'PR00',
      ConditionRateValue: 50.0,
      ConditionRateValueUnit: 'EUR',
      ConditionCurrency: 'EUR',
    },
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
    const mockService = {
      entities: {
        A_SlsPrcgCndnRecdValidity: 'A_SlsPrcgCndnRecdValidity',
      },
      run: jest.fn(async (query) => {
        const where = query?.SELECT?.where;
        if (!where) return [...MOCK_VALIDITY_RECORDS];
        return MOCK_VALIDITY_RECORDS.filter((r) => matchesWhere(r, where));
      }),
    };

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

  it('filters by workAgreementId (Personnel) and returns only PCP0 records', async () => {
    const results = await getConditionRecords({ workAgreementId: 'WA-0001' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
    expect(results[0].ConditionType).toBe('PCP0');
    expect(results[0].Personnel).toBe('WA-0001');
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

  it('flattens validity + condition record fields', async () => {
    const results = await getConditionRecords({ workAgreementId: 'WA-0001' });
    const r = results[0];
    expect(r.ConditionSequentialNumber).toBe('01');
    expect(r.ConditionTable).toBe('304');
    expect(r.ConditionRateValue).toBe(100.0);
    expect(r.ConditionRateValueUnit).toBe('EUR');
    expect(r.ConditionCurrency).toBe('EUR');
    expect(r.Customer).toBe('CUST01');
    expect(r.EngagementProject).toBe('PRJ001');
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
