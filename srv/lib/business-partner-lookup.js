const cds = require('@sap/cds');

const SERVICE_NAME = 'API_BUSINESS_PARTNER';

/**
 * Look up BusinessPartnerFullName and Mandantengruppe for a set of customer IDs
 * via API_BUSINESS_PARTNER/A_BusinessPartner.
 *
 * @param {string[]} customerIds - BusinessPartner (customer) IDs to look up
 * @returns {Promise<Map<string, {name: string, mandantengruppe: string}>>}
 */
async function getBusinessPartnerDetails(customerIds) {
  const result = new Map();
  if (!customerIds || !customerIds.length) return result;

  try {
    const srv = await cds.connect.to(SERVICE_NAME);
    const { A_BusinessPartner } = srv.entities;

    const rows = await srv.run(
      SELECT.from(A_BusinessPartner)
        .columns('BusinessPartner', 'BusinessPartnerFullName', 'YY1_Mandantengruppe2_bus')
        .where({ BusinessPartner: { in: customerIds } })
    );

    for (const row of rows) {
      if (row.BusinessPartner) {
        result.set(row.BusinessPartner, {
          name: row.BusinessPartnerFullName || '',
          mandantengruppe: row.YY1_Mandantengruppe2_bus || '',
        });
      }
    }
  } catch (e) {
    console.warn('[business-partner-lookup] Failed to fetch business partner details:', e.message);
  }

  return result;
}

module.exports = { getBusinessPartnerDetails };
