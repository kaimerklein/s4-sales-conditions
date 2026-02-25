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
    ConditionValidityStartDate: '2024-01-01',
    ConditionType: 'PSP0',
    Personnel: 'WA-0001',
    Customer: '',
    EngagementProject: '',
    YY1_Mandantengruppe_PCI: 'MG01',
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

// Employee details fixture
const EMPLOYEE_FIXTURE = [
  {
    PersonWorkAgreement: 'WA-0001',
    PersonFullName: 'Max Mustermann',
    CostCenter: 'CC100',
    CompanyCode: '1000',
  },
  {
    PersonWorkAgreement: 'WA-0002',
    PersonFullName: 'Erika Musterfrau',
    CostCenter: 'CC200',
    CompanyCode: '2000',
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

const mockEmployeeService = {
  entities: {
    YY1_TT_PersonWorkAgreement: 'YY1_TT_PersonWorkAgreement',
  },
  run: jest.fn(async (query) => {
    const where = query?.SELECT?.where;
    if (!where) return [...EMPLOYEE_FIXTURE];
    return EMPLOYEE_FIXTURE.filter((r) => matchesWhere(r, where));
  }),
};

const originalConnect = cds.connect.to.bind(cds.connect);
jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
  if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockConditionService;
  if (name === 'YY1_RSM_WORKAGRMNT_VAL_IE_CDS') return mockWorkerService;
  if (name === 'YY1_TT_PERSONWORKAGREEMENT_CDS') return mockEmployeeService;
  return originalConnect(name);
});

describe('SalesConditionService — Employees', () => {
  const test = cds.test(__dirname + '/..');

  it('returns employees filtered by WorkerId', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/Employees?$filter=WorkerId eq '10001'"
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].WorkerId).toBe('10001');
    expect(data.value[0].EmployeeName).toBe('Max Mustermann');
    expect(data.value[0].CostCenter).toBe('CC100');
    expect(data.value[0].ConditionCount).toBe(2);
  });

  it('returns employees filtered by Customer', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/Employees?$filter=Customer eq 'CUST02'"
    );
    expect(data.value.length).toBeGreaterThan(0);
  });

  it('returns empty array when no filter is provided', async () => {
    const { data } = await test.axios.get('/odata/v4/sales-condition/Employees');
    expect(data.value).toEqual([]);
  });

  it('returns empty array for unknown worker', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/Employees?$filter=WorkerId eq '99999'"
    );
    expect(data.value).toEqual([]);
  });

  it('returns single employee by key (object page navigation)', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/Employees(WorkerId='10001')"
    );
    expect(data.WorkerId).toBe('10001');
    expect(data.EmployeeName).toBe('Max Mustermann');
  });

  it('returns conditions via composition navigation path', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/Employees(WorkerId='10001')/Conditions"
    );
    expect(data.value.length).toBe(2);
    expect(data.value[0].WorkerId).toBe('10001');
  });
});

describe('SalesConditionService — EmployeeConditions', () => {
  const test = cds.test(__dirname + '/..');

  it('returns conditions for a specific employee', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/EmployeeConditions?$filter=WorkerId eq '10001'"
    );
    expect(data.value.length).toBe(2);
    // Should be sorted by PriceLevelOrder
    expect(data.value[0].PriceLevelOrder).toBeLessThanOrEqual(data.value[1].PriceLevelOrder);
  });

  it('returns conditions with PriceLevel set', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/EmployeeConditions?$filter=WorkerId eq '10001'"
    );
    for (const cond of data.value) {
      expect(cond.PriceLevel).toBeDefined();
      expect(['Project', 'Customer', 'Mandantengruppe', 'Basic']).toContain(cond.PriceLevel);
    }
  });

  it('returns empty array for unknown worker', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/EmployeeConditions?$filter=WorkerId eq '99999'"
    );
    expect(data.value).toEqual([]);
  });

  it('returns empty when no WorkerId filter', async () => {
    const { data } = await test.axios.get(
      '/odata/v4/sales-condition/EmployeeConditions'
    );
    expect(data.value).toEqual([]);
  });
});
