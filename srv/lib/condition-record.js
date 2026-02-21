const cds = require('@sap/cds');

const CONDITION_TYPE_PCP0 = 'PCP0';
const SERVICE_NAME = 'API_SLSPRICINGCONDITIONRECORD_SRV';

/**
 * Fetch sales pricing condition records (type PCP0) from the S/4 HANA
 * remote OData service.
 *
 * @param {object} params
 * @param {string} [params.workAgreementId] - Filter by work agreement ID
 * @param {string} [params.customer] - Filter by customer number
 * @returns {Promise<object[]>} Matching condition records
 * @throws {Error} If neither workAgreementId nor customer is provided
 */
async function getConditionRecords({ workAgreementId, customer } = {}) {
  if (!workAgreementId && !customer) {
    throw new Error('At least one filter is required: workAgreementId or customer');
  }

  const srv = await cds.connect.to(SERVICE_NAME);
  const { A_SlsPrcgConditionRecord } = srv.entities;

  let query = SELECT.from(A_SlsPrcgConditionRecord)
    .where({ ConditionType: CONDITION_TYPE_PCP0 });

  if (workAgreementId) {
    query = query.and({ WorkAgreement: workAgreementId });
  }
  if (customer) {
    query = query.and({ Customer: customer });
  }

  return srv.run(query);
}

module.exports = { getConditionRecords };
