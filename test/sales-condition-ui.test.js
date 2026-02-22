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
];

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

const mockConditionService = {
  entities: {
    A_SlsPrcgConditionRecord: 'A_SlsPrcgConditionRecord',
  },
  run: jest.fn(async (query) => {
    const where = query?.SELECT?.where;
    if (!where) return [...MOCK_RECORDS];
    return MOCK_RECORDS.filter((r) => matchesWhere(r, where));
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

describe('ConditionRecords entity – annotations', () => {
  let csn;

  beforeAll(async () => {
    csn = await cds.load('srv/sales-condition-service');
  });

  it('CDS model compiles successfully', () => {
    expect(csn).toBeDefined();
    const entity = csn.definitions['SalesConditionService.ConditionRecords'];
    expect(entity).toBeDefined();
    expect(entity.kind).toBe('entity');
  });

  it('has @UI.LineItem annotations', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'srv/sales-condition-annotations']);
    const entity = compiled.definitions['SalesConditionService.ConditionRecords'];
    expect(entity['@UI.LineItem']).toBeDefined();
    expect(entity['@UI.LineItem'].length).toBeGreaterThan(0);
  });

  it('has @UI.SelectionFields annotations', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'srv/sales-condition-annotations']);
    const entity = compiled.definitions['SalesConditionService.ConditionRecords'];
    expect(entity['@UI.SelectionFields']).toBeDefined();
    expect(entity['@UI.SelectionFields'].length).toBe(2);
  });

  it('has @UI.HeaderInfo annotations', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'srv/sales-condition-annotations']);
    const entity = compiled.definitions['SalesConditionService.ConditionRecords'];
    expect(entity['@UI.HeaderInfo.TypeNamePlural']).toBe('Sales Price Conditions');
    expect(entity['@UI.HeaderInfo.TypeName']).toBe('Sales Price Condition');
  });
});

describe('ConditionRecords entity – READ handler', () => {
  const test = cds.test(__dirname + '/..');

  it('returns records filtered by WorkerId', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/ConditionRecords?$filter=WorkerId eq '10001'"
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR001');
    expect(data.value[0].WorkerId).toBe('10001');
  });

  it('returns records filtered by Customer', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/ConditionRecords?$filter=Customer eq 'CUST02'"
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR002');
  });

  it('returns records filtered by both WorkerId and Customer', async () => {
    const { data } = await test.axios.get(
      "/odata/v4/sales-condition/ConditionRecords?$filter=WorkerId eq '10001' and Customer eq 'CUST01'"
    );
    expect(data.value.length).toBe(1);
    expect(data.value[0].ConditionRecord).toBe('CR001');
  });

  it('returns 400 when no filter is provided', async () => {
    try {
      await test.axios.get('/odata/v4/sales-condition/ConditionRecords');
      fail('Expected request to fail');
    } catch (e) {
      expect(e.response.status).toBe(400);
    }
  });
});
