const cds = require('@sap/cds');

const SERVICE_NAME = 'YY1_TT_PERSONWORKAGREEMENT_CDS';

/**
 * Look up employee details (name, cost center) for a set of PersonWorkAgreement IDs
 * from the YY1_TT_PERSONWORKAGREEMENT_CDS parameterized entity.
 *
 * @param {string[]} workAgreementIds - PersonWorkAgreement IDs to look up
 * @returns {Promise<Map<string, {name: string, costCenter: string, companyCode: string}>>}
 */
async function getEmployeeDetails(workAgreementIds) {
  const result = new Map();
  if (!workAgreementIds || !workAgreementIds.length) return result;

  try {
    const srv = await cds.connect.to(SERVICE_NAME);
    const { YY1_TT_PersonWorkAgreement } = srv.entities;

    const rows = await srv.run(
      SELECT.from(YY1_TT_PersonWorkAgreement)
        .where({ PersonWorkAgreement: { in: workAgreementIds } })
    );

    for (const row of rows) {
      if (!result.has(row.PersonWorkAgreement)) {
        result.set(row.PersonWorkAgreement, {
          name: row.PersonFullName || '',
          costCenter: row.CostCenter || '',
          companyCode: row.CompanyCode || '',
        });
      }
    }
  } catch (e) {
    console.warn('[employee-lookup] Failed to fetch employee details:', e.message);
  }

  return result;
}

module.exports = { getEmployeeDetails };
