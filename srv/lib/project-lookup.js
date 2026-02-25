const cds = require('@sap/cds');

const SERVICE_NAME = 'SC_EXTERNAL_SERVICES_SRV';

/**
 * Look up Customer numbers for a set of ProjectIDs via SC_EXTERNAL_SERVICES_SRV/ProjectSet.
 *
 * @param {string[]} projectIds - ProjectID values to look up
 * @returns {Promise<Map<string, string>>} Map of ProjectID → Customer
 */
async function getProjectCustomers(projectIds) {
  const result = new Map();
  if (!projectIds || !projectIds.length) return result;

  try {
    const srv = await cds.connect.to(SERVICE_NAME);
    const { ProjectSet } = srv.entities;

    const rows = await srv.run(
      SELECT.from(ProjectSet)
        .columns('ProjectID', 'Customer')
        .where({ ProjectID: { in: projectIds } })
    );

    for (const row of rows) {
      if (row.ProjectID && row.Customer) {
        result.set(row.ProjectID, row.Customer);
      }
    }
  } catch (e) {
    console.warn('[project-lookup] Failed to fetch project customers:', e.message);
  }

  return result;
}

module.exports = { getProjectCustomers };
