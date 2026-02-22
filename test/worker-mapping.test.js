const cds = require('@sap/cds');

// Fixture data simulating the remote YY1_RSM_WORKAGRMNT_VAL_IE service.
// Worker 10001 has two rows for the same PersonWorkAgreement (duplicate validity periods)
// and one row for a different PersonWorkAgreement.
const FIXTURE_ROWS = [
  {
    PersonWorkAgreement: 'WA-0001',
    PersonWorkAgreementExternalID: '10001',
    CompanyCode: '1000',
    CompanyCodeName: 'ACME Corp',
    Company: 'AC',
    StartDate: '2024-01-01',
    EndDate: '2024-06-30',
  },
  {
    PersonWorkAgreement: 'WA-0001',
    PersonWorkAgreementExternalID: '10001',
    CompanyCode: '1000',
    CompanyCodeName: 'ACME Corp',
    Company: 'AC',
    StartDate: '2024-07-01',
    EndDate: '2024-12-31',
  },
  {
    PersonWorkAgreement: 'WA-0002',
    PersonWorkAgreementExternalID: '10001',
    CompanyCode: '2000',
    CompanyCodeName: 'Beta Ltd',
    Company: 'BL',
    StartDate: '2024-01-01',
    EndDate: '2024-12-31',
  },
  {
    PersonWorkAgreement: 'WA-0010',
    PersonWorkAgreementExternalID: '10002',
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
    i += 3;
  }
  return true;
}

const mockWorkerService = {
  entities: {
    YY1_RSM_WORKAGRMNT_VAL_IE: 'YY1_RSM_WORKAGRMNT_VAL_IE',
  },
  run: jest.fn(async (query) => {
    const where = query?.SELECT?.where;
    if (!where) return [...FIXTURE_ROWS];
    return FIXTURE_ROWS.filter((r) => matchesWhere(r, where));
  }),
};

const originalConnect = cds.connect.to.bind(cds.connect);
jest.spyOn(cds.connect, 'to').mockImplementation(async (name) => {
  if (name === 'YY1_RSM_WORKAGRMNT_VAL_IE_CDS') return mockWorkerService;
  return originalConnect(name);
});

describe('WorkerMappingService', () => {
  const test = cds.test(__dirname + '/..');

  describe('via OData', () => {
    it('returns deduplicated work agreements for a known worker', async () => {
      const { data } = await test.axios.get(
        '/odata/v4/worker-mapping/getWorkAgreement(workerId=\'10001\')'
      );
      // Worker 10001 has 3 rows but only 2 unique PersonWorkAgreement values
      expect(data.value.length).toBe(2);
      expect(data.value[0].workAgreementId).toBe('WA-0001');
      expect(data.value[0].companyCode).toBe('1000');
      expect(data.value[0].companyCodeName).toBe('ACME Corp');
      expect(data.value[0].company).toBe('AC');
      expect(data.value[1].workAgreementId).toBe('WA-0002');
    });

    it('returns 404 for an unknown worker ID', async () => {
      try {
        await test.axios.get(
          '/odata/v4/worker-mapping/getWorkAgreement(workerId=\'99999\')'
        );
        fail('expected request to fail');
      } catch (e) {
        expect(e.response.status).toBe(404);
      }
    });

    it('returns 400 when workerId is empty', async () => {
      try {
        await test.axios.get(
          '/odata/v4/worker-mapping/getWorkAgreement(workerId=\'\')'
        );
        fail('expected request to fail');
      } catch (e) {
        expect(e.response.status).toBe(400);
      }
    });
  });

  describe('lib module directly', () => {
    let getWorkAgreement;

    beforeAll(() => {
      getWorkAgreement = require('../srv/lib/worker-mapping').getWorkAgreement;
    });

    it('returns deduplicated mappings with extended fields', async () => {
      const result = await getWorkAgreement('10001');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        workAgreementId: 'WA-0001',
        companyCode: '1000',
        companyCodeName: 'ACME Corp',
        company: 'AC',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
      });
      expect(result[1]).toEqual({
        workAgreementId: 'WA-0002',
        companyCode: '2000',
        companyCodeName: 'Beta Ltd',
        company: 'BL',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
    });

    it('returns a single mapping for worker with one agreement', async () => {
      const result = await getWorkAgreement('10002');
      expect(result).toHaveLength(1);
      expect(result[0].workAgreementId).toBe('WA-0010');
      expect(result[0].companyCode).toBe('3000');
    });

    it('returns null for an unknown worker', async () => {
      const result = await getWorkAgreement('unknown');
      expect(result).toBeNull();
    });
  });
});
