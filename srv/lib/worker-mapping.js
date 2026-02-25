const cds = require('@sap/cds');

const SERVICE_NAME = 'YY1_RSM_WORKAGRMNT_VAL_IE_CDS';

/**
 * Look up work agreement mappings for a given worker ID via the
 * YY1_RSM_WORKAGRMNT_VAL_IE OData service.
 *
 * The remote service may return multiple rows per PersonWorkAgreement
 * (different validity periods). We deduplicate by PersonWorkAgreement.
 *
 * @param {string} workerId - PersonWorkAgreementExternalID (worker / employee number)
 * @returns {Promise<Array<{workAgreementId: string, companyCode: string, companyCodeName: string, company: string, startDate: string, endDate: string}> | null>}
 *   Array of unique work agreement mappings, or null if none found.
 */
async function getWorkAgreement(workerId) {
  const srv = await cds.connect.to(SERVICE_NAME);
  const { YY1_RSM_WORKAGRMNT_VAL_IE } = srv.entities;

  const results = await srv.run(
    SELECT.from(YY1_RSM_WORKAGRMNT_VAL_IE)
      .where({ PersonWorkAgreementExternalID: workerId })
  );

  if (!results.length) return null;

  // Deduplicate by PersonWorkAgreement
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.PersonWorkAgreement)) return false;
    seen.add(r.PersonWorkAgreement);
    return true;
  }).map(r => ({
    workAgreementId: r.PersonWorkAgreement,
    companyCode: r.CompanyCode,
    companyCodeName: r.CompanyCodeName,
    company: r.Company,
    startDate: r.StartDate,
    endDate: r.EndDate,
  }));
}

/**
 * Batch lookup: resolve multiple worker IDs to their PersonWorkAgreements.
 *
 * @param {string[]} workerIds - Array of PersonWorkAgreementExternalIDs
 * @returns {Promise<Map<string, Array<{workAgreementId: string, companyCode: string, companyCodeName: string}>>>}
 */
async function getWorkAgreements(workerIds) {
  const result = new Map();
  if (!workerIds || !workerIds.length) return result;

  const srv = await cds.connect.to(SERVICE_NAME);
  const { YY1_RSM_WORKAGRMNT_VAL_IE } = srv.entities;

  const rows = await srv.run(
    SELECT.from(YY1_RSM_WORKAGRMNT_VAL_IE)
      .where({ PersonWorkAgreementExternalID: { in: workerIds } })
  );

  for (const r of rows) {
    const wid = r.PersonWorkAgreementExternalID;
    if (!result.has(wid)) result.set(wid, []);
    const list = result.get(wid);
    // Deduplicate by PersonWorkAgreement within each worker
    if (!list.some(m => m.workAgreementId === r.PersonWorkAgreement)) {
      list.push({
        workAgreementId: r.PersonWorkAgreement,
        companyCode: r.CompanyCode,
        companyCodeName: r.CompanyCodeName,
      });
    }
  }

  return result;
}

/**
 * Reverse lookup: given PersonWorkAgreement IDs, find corresponding WorkerIds.
 *
 * @param {string[]} agreementIds - PersonWorkAgreement values
 * @returns {Promise<Map<string, string>>} Map of PersonWorkAgreement → WorkerId
 */
async function getWorkerIdsByAgreements(agreementIds) {
  const result = new Map();
  if (!agreementIds || !agreementIds.length) return result;

  const srv = await cds.connect.to(SERVICE_NAME);
  const { YY1_RSM_WORKAGRMNT_VAL_IE } = srv.entities;

  const rows = await srv.run(
    SELECT.from(YY1_RSM_WORKAGRMNT_VAL_IE)
      .where({ PersonWorkAgreement: { in: agreementIds } })
  );

  for (const r of rows) {
    if (!result.has(r.PersonWorkAgreement)) {
      result.set(r.PersonWorkAgreement, r.PersonWorkAgreementExternalID);
    }
  }

  return result;
}

module.exports = { getWorkAgreement, getWorkAgreements, getWorkerIdsByAgreements };
