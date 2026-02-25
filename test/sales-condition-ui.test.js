const cds = require('@sap/cds');

const MOCK_VALIDITY_RECORDS = [];
const MOCK_CONDITION_RECORDS = [];
const WORKER_FIXTURE = [];
const EMPLOYEE_FIXTURE = [];

function matchesWhere() { return true; }

const mockConditionService = {
  entities: {
    A_SlsPrcgCndnRecdValidity: 'A_SlsPrcgCndnRecdValidity',
    A_SlsPrcgConditionRecord: 'A_SlsPrcgConditionRecord',
  },
  run: jest.fn(async () => []),
};

const mockWorkerService = {
  entities: { YY1_RSM_WORKAGRMNT_VAL_IE: 'YY1_RSM_WORKAGRMNT_VAL_IE' },
  run: jest.fn(async () => []),
};

const mockEmployeeService = {
  entities: { YY1_TT_PersonWorkAgreement: 'YY1_TT_PersonWorkAgreement' },
  run: jest.fn(async () => []),
  send: jest.fn(async () => []),
};

const originalConnect = cds.connect.to.bind(cds.connect);
jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
  if (name === 'API_SLSPRICINGCONDITIONRECORD_SRV') return mockConditionService;
  if (name === 'YY1_RSM_WORKAGRMNT_VAL_IE_CDS') return mockWorkerService;
  if (name === 'YY1_TT_PERSONWORKAGREEMENT_CDS') return mockEmployeeService;
  return originalConnect(name);
});

describe('Employees entity – annotations', () => {
  it('CDS model compiles successfully', async () => {
    const csn = await cds.load('srv/sales-condition-service');
    expect(csn).toBeDefined();
    const entity = csn.definitions['SalesConditionService.Employees'];
    expect(entity).toBeDefined();
    expect(entity.kind).toBe('entity');
  });

  it('has EmployeeConditions entity', async () => {
    const csn = await cds.load('srv/sales-condition-service');
    const entity = csn.definitions['SalesConditionService.EmployeeConditions'];
    expect(entity).toBeDefined();
    expect(entity.kind).toBe('entity');
  });

  it('has @UI.LineItem annotations on Employees', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'app/pricing-app/annotations']);
    const entity = compiled.definitions['SalesConditionService.Employees'];
    expect(entity['@UI.LineItem']).toBeDefined();
    expect(entity['@UI.LineItem'].length).toBeGreaterThan(0);
  });

  it('has @UI.SelectionFields on Employees with 4 fields', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'app/pricing-app/annotations']);
    const entity = compiled.definitions['SalesConditionService.Employees'];
    expect(entity['@UI.SelectionFields']).toBeDefined();
    expect(entity['@UI.SelectionFields'].length).toBe(4);
  });

  it('has @UI.HeaderInfo annotations on Employees', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'app/pricing-app/annotations']);
    const entity = compiled.definitions['SalesConditionService.Employees'];
    expect(entity['@UI.HeaderInfo.TypeNamePlural']).toBe('Employees');
    expect(entity['@UI.HeaderInfo.TypeName']).toBe('Employee');
  });

  it('has @UI.LineItem annotations on EmployeeConditions', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'app/pricing-app/annotations']);
    const entity = compiled.definitions['SalesConditionService.EmployeeConditions'];
    expect(entity['@UI.LineItem']).toBeDefined();
    expect(entity['@UI.LineItem'].length).toBeGreaterThan(0);
  });

  it('has @UI.PresentationVariant on EmployeeConditions', async () => {
    const compiled = await cds.load(['srv/sales-condition-service', 'app/pricing-app/annotations']);
    const entity = compiled.definitions['SalesConditionService.EmployeeConditions'];
    expect(entity['@UI.PresentationVariant.SortOrder']).toBeDefined();
    expect(entity['@UI.PresentationVariant.GroupBy']).toBeDefined();
    expect(entity['@UI.PresentationVariant.Visualizations']).toBeDefined();
  });
});
