const { createHandler } = require('@app-core/server');
const processPaymentInstructionService = require('@app/services/payment-instructions/process-payment-instruction');

module.exports = createHandler({
  path: '/payment-instructions',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = rc.body;

    const responseData = await processPaymentInstructionService(payload);

    const httpStatus =
      responseData.status === 'successful' || responseData.status === 'pending'
        ? helpers.http_statuses.HTTP_200_OK
        : helpers.http_statuses.HTTP_400_BAD_REQUEST;

    return {
      status: httpStatus,
      data: responseData,
    };
  },
});
