// Mock worker ID -> work agreement mapping.
// Replace this module with a real OData call to the Employee Central API
// when it becomes available. The function signature must stay the same.

const MOCK_MAPPINGS = {
  '10001': { workAgreementId: 'WA-0001', validityStartDate: '2024-01-01' },
  '10002': { workAgreementId: 'WA-0002', validityStartDate: '2024-03-15' },
  '10003': { workAgreementId: 'WA-0003', validityStartDate: '2023-06-01' },
};

/**
 * Look up the work agreement for a given worker ID.
 * @param {string} workerId - The worker / employee personal number.
 * @returns {{ workAgreementId: string, validityStartDate: string } | null}
 */
function getWorkAgreement(workerId) {
  return MOCK_MAPPINGS[workerId] ?? null;
}

module.exports = { getWorkAgreement };
