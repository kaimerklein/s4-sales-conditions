const cds = require('@sap/cds');
const { getWorkAgreement } = require('./lib/worker-mapping');
const { getConditionRecords } = require('./lib/condition-record');

module.exports = class SalesConditionService extends cds.ApplicationService {
  init() {
    this.on('getConditionRecords', async (req) => {
      const { workerId, customer } = req.data;

      if (!workerId && !customer) {
        return req.reject(400, 'At least one filter is required: workerId or customer');
      }

      let workAgreementId;
      if (workerId) {
        const mappings = await getWorkAgreement(workerId);
        if (!mappings) {
          return req.reject(404, `No work agreement found for worker ID "${workerId}"`);
        }
        workAgreementId = mappings[0].workAgreementId;
      }

      return getConditionRecords({ workAgreementId, customer });
    });

    return super.init();
  }
};
