const cds = require('@sap/cds');

// Mock validity records including Mandantengruppe field
const MOCK_VALIDITY_RECORDS = [
  {
    ConditionRecord: 'CR001',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: 'PRJ001',
    YY1_Mandantengruppe_PCI: '',
  },
  {
    ConditionRecord: 'CR002',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-03-01',
    ConditionType: 'PCP0',
    Personnel: 'WA-0002',
    Customer: 'CUST02',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: '',
  },
  {
    ConditionRecord: 'CR003',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-06-01',
    ConditionType: 'PSP0',
    Personnel: 'WA-0001',
    Customer: '',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: '',
  },
  {
    ConditionRecord: 'CR004',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PR00',
    Personnel: 'WA-0001',
    Customer: 'CUST01',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: '',
  },
  {
    ConditionRecord: 'CR005',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PSP0',
    Personnel: 'WA-0003',
    Customer: 'CUST03',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: 'MG01',
  },
  {
    ConditionRecord: 'CR006',
    ConditionValidityEndDate: '2024-12-31',
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PSP0',
    Personnel: 'WA-0003',
    Customer: '',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: 'MG02',
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
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'EUR',
  },
  {
    ConditionRecord: 'CR002',
    ConditionSequentialNumber: '01',
    ConditionTable: '304',
    ConditionType: 'PCP0',
    ConditionRateValue: 200.0,
    ConditionRateValueUnit: 'USD',
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'USD',
  },
  {
    ConditionRecord: 'CR003',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PSP0',
    ConditionRateValue: 150.0,
    ConditionRateValueUnit: 'EUR',
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'EUR',
  },
  {
    ConditionRecord: 'CR004',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PR00',
    ConditionRateValue: 50.0,
    ConditionRateValueUnit: 'EUR',
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'EUR',
  },
  {
    ConditionRecord: 'CR005',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PSP0',
    ConditionRateValue: 120.0,
    ConditionRateValueUnit: 'EUR',
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'EUR',
  },
  {
    ConditionRecord: 'CR006',
    ConditionSequentialNumber: '01',
    ConditionTable: '305',
    ConditionType: 'PSP0',
    ConditionRateValue: 110.0,
    ConditionRateValueUnit: 'EUR',
    ConditionQuantityUnit: 'H',
    ConditionCurrency: 'EUR',
  },
];

/**
 * Simple matcher for CDS-style WHERE clause arrays against a record object.
 * Handles flat conjunctions and `in` lists.
 */
function matchesWhere(record, where) {
  let i = 0;
  while (i < where.length) {
    if (where[i] === 'and') { i++; continue; }

    const left = where[i];
    const op = where[i + 1];
    const right = where[i + 2];

    if (left?.ref && right?.val !== undefined) {
      const field = left.ref[0];
      if (op === '=' && record[field] !== right.val) return false;
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

describe('condition-record lib', () => {
  let getConditionRecords, derivePriceLevel;

  beforeAll(() => {
    const mockService = {
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
        // Default: validity records
        if (!where) return [...MOCK_VALIDITY_RECORDS];
        return MOCK_VALIDITY_RECORDS.filter((r) => matchesWhere(r, where));
      }),
    };

    const originalConnect = cds.connect.to.bind(cds.connect);
    jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
      if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockService;
      return originalConnect(name);
    });

    const mod = require('../srv/lib/condition-record');
    getConditionRecords = mod.getConditionRecords;
    derivePriceLevel = mod.derivePriceLevel;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('filters by workAgreementId (Personnel) and returns PCP0 and PSP0 records', async () => {
    const results = await getConditionRecords({ workAgreementIds: 'WA-0001' });
    expect(results.length).toBe(2);
    expect(results[0].ConditionRecord).toBe('CR001');
    expect(results[0].ConditionType).toBe('PCP0');
    expect(results[0].Personnel).toBe('WA-0001');
    expect(results[1].ConditionRecord).toBe('CR003');
    expect(results[1].ConditionType).toBe('PSP0');
  });

  it('filters by customer and returns only matching records', async () => {
    const results = await getConditionRecords({ customers: 'CUST02' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR002');
  });

  it('filters by both workAgreementId and customer', async () => {
    const results = await getConditionRecords({
      workAgreementIds: 'WA-0001',
      customers: 'CUST01',
    });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
  });

  it('flattens validity + condition record fields with PriceLevel', async () => {
    const results = await getConditionRecords({ workAgreementIds: 'WA-0001' });
    const r = results[0];
    expect(r.ConditionTable).toBe('304');
    expect(r.ConditionRateValue).toBe(100.0);
    expect(r.ConditionRateValueUnit).toBe('EUR');
    expect(r.ConditionCurrency).toBe('EUR');
    expect(r.Customer).toBe('CUST01');
    expect(r.EngagementProject).toBe('PRJ001');
    expect(r.Mandantengruppe).toBe('');
    expect(r.PriceLevel).toBe('Project');
    expect(r.PriceLevelOrder).toBe(1);
  });

  it('throws when no filter is provided', async () => {
    await expect(getConditionRecords({})).rejects.toThrow(
      'At least one filter is required'
    );
  });

  it('throws when called without arguments', async () => {
    await expect(getConditionRecords()).rejects.toThrow(
      'At least one filter is required'
    );
  });

  it('supports multiple work agreement IDs', async () => {
    const results = await getConditionRecords({ workAgreementIds: ['WA-0001', 'WA-0002'] });
    expect(results.length).toBe(3);
    const ids = results.map(r => r.ConditionRecord);
    expect(ids).toContain('CR001');
    expect(ids).toContain('CR002');
    expect(ids).toContain('CR003');
  });

  it('returns empty array when no records match', async () => {
    const results = await getConditionRecords({ workAgreementIds: 'WA-9999' });
    expect(results).toEqual([]);
  });

  // Mandantengruppe filter tests
  it('filters by Mandantengruppe', async () => {
    const results = await getConditionRecords({ mandantengruppen: 'MG01' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR005');
    expect(results[0].Mandantengruppe).toBe('MG01');
  });

  it('filters by multiple Mandantengruppen', async () => {
    const results = await getConditionRecords({ mandantengruppen: ['MG01', 'MG02'] });
    expect(results.length).toBe(2);
    const ids = results.map(r => r.ConditionRecord);
    expect(ids).toContain('CR005');
    expect(ids).toContain('CR006');
  });

  // Multi-value filter tests
  it('supports multiple customers', async () => {
    const results = await getConditionRecords({ customers: ['CUST01', 'CUST02'] });
    expect(results.length).toBe(2);
    expect(results.map(r => r.ConditionRecord)).toEqual(expect.arrayContaining(['CR001', 'CR002']));
  });

  it('supports multiple engagement projects', async () => {
    const results = await getConditionRecords({ engagementProjects: 'PRJ001' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
  });

  // Legacy single-value params
  it('supports legacy single-value customer param', async () => {
    const results = await getConditionRecords({ customer: 'CUST02' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR002');
  });

  it('supports legacy single-value engagementProject param', async () => {
    const results = await getConditionRecords({ engagementProject: 'PRJ001' });
    expect(results.length).toBe(1);
    expect(results[0].ConditionRecord).toBe('CR001');
  });
});

describe('derivePriceLevel', () => {
  let derivePriceLevel;

  beforeAll(() => {
    derivePriceLevel = require('../srv/lib/condition-record').derivePriceLevel;
  });

  it('returns Project for PCP0 with EngagementProject', () => {
    const result = derivePriceLevel('PCP0', 'CUST01', 'PRJ001', '');
    expect(result).toEqual({ PriceLevel: 'Project', PriceLevelOrder: 1 });
  });

  it('returns Customer for PSP0 with Customer', () => {
    const result = derivePriceLevel('PSP0', 'CUST01', '', '');
    expect(result).toEqual({ PriceLevel: 'Customer', PriceLevelOrder: 2 });
  });

  it('returns Mandantengruppe for PSP0 with Mandantengruppe', () => {
    const result = derivePriceLevel('PSP0', '', '', 'MG01');
    expect(result).toEqual({ PriceLevel: 'Mandantengruppe', PriceLevelOrder: 3 });
  });

  it('returns Basic for PSP0 with no specifics', () => {
    const result = derivePriceLevel('PSP0', '', '', '');
    expect(result).toEqual({ PriceLevel: 'Basic', PriceLevelOrder: 4 });
  });

  it('Customer takes priority over Mandantengruppe for PSP0', () => {
    const result = derivePriceLevel('PSP0', 'CUST01', '', 'MG01');
    expect(result).toEqual({ PriceLevel: 'Customer', PriceLevelOrder: 2 });
  });
});
