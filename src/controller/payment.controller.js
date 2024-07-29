const { STATUS_CODE, MESSAGE_CODE } = require('@/enums/response');
const transactionModel = require('@/model/transaction.model');
const momoPaymentMethod = require('@/payments/momo.payment');
const { createResponse } = require('@/utils/responseHelper');

module.exports = {
    payment: async (req, res, next) => {
        const userId = req.user._id;
        try {
            const transaction = await transactionModel.create({ userId, ...req.body });

            const data = await momoPaymentMethod(transaction);

            transaction.partnerCode = data.partnerCode;
            transaction.requestId = data.requestId;
            transaction.deeplink = data.deeplink;
            transaction.status = 'processing';
            transaction.payUrl = data.payUrl;
            transaction.qrCodeUrl = data.qrCodeUrl;
            transaction.responseTime = data.responseTime;

            await transaction.save();

            res.status(STATUS_CODE.OK).json(
                createResponse(
                    {
                        payUrl: data.payUrl,
                        qrCodeUrl: data.qrCodeUrl,
                        responseTime: data.responseTime,
                    },
                    MESSAGE_CODE.CREATE_PAYMENT_MOMO_LINK_SUCCESSFULLY,
                    MESSAGE_CODE.CREATE_PAYMENT_MOMO_LINK_SUCCESSFULLY,
                    STATUS_CODE.OK,
                    true,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
    notify: async (req, res, next) => {
        try {
            console.log(req.body);

            res.status(200).send(req.body);
        } catch (error) {
            next(error);
        }
    },
};
