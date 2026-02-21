const cds = require('@sap/cds');
const { getWorkAgreement } = require('../srv/lib/worker-mapping');

describe('WorkerMappingService', () => {
  const test = cds.test(__dirname + '/..');

  describe('via OData', () => {
    it('returns a work agreement for a known worker ID', async () => {
      const { data } = await test.axios.get(
        '/odata/v4/worker-mapping/getWorkAgreement(workerId=\'10001\')'
      );
      expect(data.workAgreementId).toBe('WA-0001');
      expect(data.validityStartDate).toBe('2024-01-01');
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

    it('returns 400 when workerId is missing', async () => {
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
    it('returns mapping for a known worker', () => {
      const result = getWorkAgreement('10002');
      expect(result).toEqual({
        workAgreementId: 'WA-0002',
        validityStartDate: '2024-03-15',
      });
    });

    it('returns null for an unknown worker', () => {
      expect(getWorkAgreement('unknown')).toBeNull();
    });
  });
});
