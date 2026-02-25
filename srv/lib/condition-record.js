const cds = require('@sap/cds');

const CONDITION_TYPES = ['PCP0', 'PSP0'];
const SERVICE_NAME = 'API_SLSPRICINGCONDITIONRECORD_SRV';

/**
 * Derive price level from condition type and populated fields.
 *
 * - Project: ConditionType = 'PCP0', EngagementProject non-empty
 * - Customer: ConditionType = 'PSP0', Customer non-empty
 * - Mandantengruppe: ConditionType = 'PSP0', YY1_Mandantengruppe_PCI non-empty
 * - Basic: ConditionType = 'PSP0', none of above populated
 */
function derivePriceLevel(conditionType, customer, engagementProject, mandantengruppe) {
  if (conditionType === 'PCP0' && engagementProject) {
    return { PriceLevel: 'Project', PriceLevelOrder: 1 };
  }
  if (conditionType === 'PSP0' && customer) {
    return { PriceLevel: 'Customer', PriceLevelOrder: 2 };
  }
  if (conditionType === 'PSP0' && mandantengruppe) {
    return { PriceLevel: 'Mandantengruppe', PriceLevelOrder: 3 };
  }
  return { PriceLevel: 'Basic', PriceLevelOrder: 4 };
}

/**
 * Fetch sales pricing condition records (types PCP0, PSP0) from the S/4 HANA
 * remote OData service.
 *
 * All filter parameters accept arrays for multi-value filtering.
 *
 * @param {object} params
 * @param {string|string[]} [params.workAgreementIds] - Personnel / work agreement ID(s)
 * @param {string|string[]} [params.customers] - Filter by customer number(s)
 * @param {string|string[]} [params.engagementProjects] - Filter by engagement project(s)
 * @param {string|string[]} [params.mandantengruppen] - Filter by Mandantengruppe(s)
 * @returns {Promise<object[]>} Matching condition records (flattened)
 * @throws {Error} If no filter is provided
 */
async function getConditionRecords({ workAgreementIds, customers, engagementProjects, mandantengruppen,
                                      // Legacy single-value params for backward compat
                                      customer, engagementProject } = {}) {
  const ids = _toArray(workAgreementIds);
  const custList = _toArray(customers || customer);
  const projList = _toArray(engagementProjects || engagementProject);
  const mgList = _toArray(mandantengruppen);

  if (!ids.length && !custList.length && !projList.length && !mgList.length) {
    throw new Error('At least one filter is required: workAgreementIds, customers, engagementProjects, or mandantengruppen');
  }

  const srv = await cds.connect.to(SERVICE_NAME);
  const { A_SlsPrcgCndnRecdValidity } = srv.entities;

  const query = SELECT.from(A_SlsPrcgCndnRecdValidity)
    .where({ ConditionType: { in: CONDITION_TYPES } });
  if (ids.length) query.and({ Personnel: { in: ids } });
  if (custList.length) query.and(custList.length === 1 ? { Customer: custList[0] } : { Customer: { in: custList } });
  if (projList.length) query.and(projList.length === 1 ? { EngagementProject: projList[0] } : { EngagementProject: { in: projList } });
  if (mgList.length) query.and(mgList.length === 1 ? { YY1_Mandantengruppe_PCI: mgList[0] } : { YY1_Mandantengruppe_PCI: { in: mgList } });

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
    const mg = v.YY1_Mandantengruppe_PCI || '';
    const ep = v.EngagementProject || '';
    const cust = v.Customer || '';
    const { PriceLevel, PriceLevelOrder } = derivePriceLevel(v.ConditionType, cust, ep, mg);

    return {
      ConditionRecord: v.ConditionRecord,
      ConditionTable: rec.ConditionTable || '',
      ConditionType: v.ConditionType,
      ConditionValidityStartDate: v.ConditionValidityStartDate,
      ConditionValidityEndDate: v.ConditionValidityEndDate,
      ConditionRateValue: rec.ConditionRateValue ?? null,
      ConditionRateValueUnit: rec.ConditionRateValueUnit || '',
      ConditionCurrency: rec.ConditionCurrency || '',
      Personnel: v.Personnel,
      Customer: cust,
      EngagementProject: ep,
      Mandantengruppe: mg,
      PriceLevel,
      PriceLevelOrder,
    };
  });
}

function _toArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

module.exports = { getConditionRecords, derivePriceLevel };
