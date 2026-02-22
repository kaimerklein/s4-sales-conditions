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

    this.on('READ', 'ConditionRecords', async (req) => {
      const filters = _extractFilters(req.query.SELECT.where);

      if (!filters.WorkerId && !filters.Customer) {
        return req.reject(400, 'At least one filter is required: WorkerId or Customer');
      }

      let workAgreementId;
      if (filters.WorkerId) {
        const mappings = await getWorkAgreement(filters.WorkerId);
        if (!mappings) {
          return req.reject(404, `No work agreement found for worker ID "${filters.WorkerId}"`);
        }
        workAgreementId = mappings[0].workAgreementId;
      }

      const records = await getConditionRecords({
        workAgreementId,
        customer: filters.Customer,
      });

      return records.map((r) => ({ ...r, WorkerId: filters.WorkerId || '' }));
    });

    return super.init();
  }
};

/**
 * Extract filter values from a CDS SELECT.where array.
 * The array uses the pattern: [{ref:[field]}, '=', {val:value}, 'and', ...]
 */
function _extractFilters(where) {
  const filters = {};
  if (!where) return filters;
  let i = 0;
  while (i < where.length) {
    if (where[i] === 'and') { i++; continue; }
    const left = where[i];
    const op = where[i + 1];
    const right = where[i + 2];
    if (left?.ref && op === '=' && right?.val !== undefined) {
      filters[left.ref[0]] = right.val;
    }
    i += 3;
  }
  return filters;
}
