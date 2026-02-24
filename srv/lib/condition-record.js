const cds = require('@sap/cds');

const CONDITION_TYPES = ['PCP0', 'PSP0'];
const SERVICE_NAME = 'API_SLSPRICINGCONDITIONRECORD_SRV';

/**
 * Fetch sales pricing condition records (types PCP0, PSP0) from the S/4 HANA
 * remote OData service.
 *
 * Queries A_SlsPrcgCndnRecdValidity filtered by ConditionType, Personnel,
 * and/or Customer, then fetches associated condition records for details.
 *
 * @param {object} params
 * @param {string|string[]} [params.workAgreementIds] - Personnel / work agreement ID(s)
 * @param {string} [params.customer] - Filter by customer number
 * @param {string} [params.engagementProject] - Filter by engagement project
 * @returns {Promise<object[]>} Matching condition records (flattened)
 * @throws {Error} If neither workAgreementIds nor customer is provided
 */
async function getConditionRecords({ workAgreementIds, customer, engagementProject } = {}) {
  const ids = Array.isArray(workAgreementIds) ? workAgreementIds
    : workAgreementIds ? [workAgreementIds] : [];

  if (!ids.length && !customer && !engagementProject) {
    throw new Error('At least one filter is required: workAgreementIds, customer, or engagementProject');
  }

  const srv = await cds.connect.to(SERVICE_NAME);
  const { A_SlsPrcgCndnRecdValidity } = srv.entities;

  const query = SELECT.from(A_SlsPrcgCndnRecdValidity)
    .where({ ConditionType: { in: CONDITION_TYPES } });
  if (ids.length) query.and({ Personnel: { in: ids } });
  if (customer) query.and({ Customer: customer });
  if (engagementProject) query.and({ EngagementProject: engagementProject });

  const results = await srv.run(query);

  if (!results.length) return [];

  // Fetch associated condition records for each validity entry
  const { A_SlsPrcgConditionRecord } = srv.entities;
  const conditionRecordIds = [...new Set(results.map(v => v.ConditionRecord))];
  const condRecords = await srv.run(
    SELECT.from(A_SlsPrcgConditionRecord).where({ ConditionRecord: { in: conditionRecordIds } })
  );
  const recMap = Object.fromEntries(condRecords.map(r => [r.ConditionRecord, r]));

  return results.map(v => {
    const rec = recMap[v.ConditionRecord] || {};
    return {
      ConditionRecord: v.ConditionRecord,
      ConditionSequentialNumber: rec.ConditionSequentialNumber || '',
      ConditionTable: rec.ConditionTable || '',
      ConditionType: v.ConditionType,
      ConditionValidityStartDate: v.ConditionValidityStartDate,
      ConditionValidityEndDate: v.ConditionValidityEndDate,
      ConditionRateValue: rec.ConditionRateValue ?? null,
      ConditionRateValueUnit: rec.ConditionRateValueUnit || '',
      ConditionCurrency: rec.ConditionCurrency || '',
      Personnel: v.Personnel,
      Customer: v.Customer,
      EngagementProject: v.EngagementProject || '',
    };
  });
}

module.exports = { getConditionRecords };
