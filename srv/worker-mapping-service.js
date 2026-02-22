const { getWorkAgreement } = require('./lib/worker-mapping');

module.exports = function () {
  this.on('getWorkAgreement', async (req) => {
    const { workerId } = req.data;
    if (!workerId) return req.reject(400, 'workerId is required');
    const result = await getWorkAgreement(workerId);
    if (!result) return req.reject(404, `No work agreement found for worker ${workerId}`);
    return result;
  });
};
