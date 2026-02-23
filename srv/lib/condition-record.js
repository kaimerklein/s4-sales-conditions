const cds = require('@sap/cds');

const CONDITION_TYPE_PCP0 = 'PCP0';
const SERVICE_NAME = 'API_SLSPRICINGCONDITIONRECORD_SRV';

/**
 * Fetch sales pricing condition records (type PCP0) from the S/4 HANA
 * remote OData service.
 *
 * Queries A_SlsPrcgCndnRecdValidity filtered by ConditionType, Personnel,
 * and/or Customer, then expands to_SlsPrcgConditionRecord to get full
 * condition record details.
 *
 * @param {object} params
 * @param {string} [params.workAgreementId] - Personnel / work agreement ID
 * @param {string} [params.customer] - Filter by customer number
 * @returns {Promise<object[]>} Matching condition records (flattened)
 * @throws {Error} If neither workAgreementId nor customer is provided
 */
async function getConditionRecords({ workAgreementId, customer } = {}) {
  if (!workAgreementId && !customer) {
    throw new Error('At least one filter is required: workAgreementId or customer');
  }

  const srv = await cds.connect.to(SERVICE_NAME);
  const { A_SlsPrcgCndnRecdValidity } = srv.entities;

  const filters = { ConditionType: CONDITION_TYPE_PCP0 };
  if (workAgreementId) filters.Personnel = workAgreementId;
  if (customer) filters.Customer = customer;

  const query = SELECT.from(A_SlsPrcgCndnRecdValidity)
    .where(filters)
    .columns(col => {
      col.ConditionRecord,
      col.ConditionValidityEndDate,
      col.ConditionValidityStartDate,
      col.ConditionType,
      col.Personnel,
      col.Customer,
      col.EngagementProject,
      col.to_SlsPrcgConditionRecord(rec => {
        rec.ConditionRecord,
        rec.ConditionSequentialNumber,
        rec.ConditionTable,
        rec.ConditionType,
        rec.ConditionRateValue,
        rec.ConditionRateValueUnit,
        rec.ConditionCurrency
      })
    });

  const results = await srv.run(query);

  return results.map(v => {
    const rec = v.to_SlsPrcgConditionRecord || {};
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
