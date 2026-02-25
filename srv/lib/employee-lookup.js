const cds = require('@sap/cds');

const SERVICE_NAME = 'YY1_TT_PERSONWORKAGREEMENT_CDS';

/**
 * Look up employee details (name, cost center) for a set of PersonWorkAgreement IDs
 * from the YY1_TT_PERSONWORKAGREEMENT_CDS parameterized entity.
 *
 * The OData V2 service uses a parameterized pattern:
 *   YY1_TT_PersonWorkAgreement(P_KeyDate=datetime'...')/Set
 *
 * @param {string[]} workAgreementIds - PersonWorkAgreement IDs to look up
 * @returns {Promise<Map<string, {name: string, costCenter: string, companyCode: string}>>}
 */
async function getEmployeeDetails(workAgreementIds) {
  const result = new Map();
  if (!workAgreementIds || !workAgreementIds.length) return result;

  try {
    const srv = await cds.connect.to(SERVICE_NAME);

    // Build the parameterized path with today's date
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00';
    const filterParts = workAgreementIds.map(
      id => `PersonWorkAgreement eq '${id}'`
    );
    const filter = filterParts.join(' or ');
    const path = `/YY1_TT_PersonWorkAgreement(P_KeyDate=datetime'${today}')/Set?$filter=${filter}`;

    const rows = await srv.send('GET', path);

    const list = Array.isArray(rows) ? rows : (rows?.value || []);
    for (const row of list) {
      const id = row.PersonWorkAgreement;
      if (id && !result.has(id)) {
        result.set(id, {
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
