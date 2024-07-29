const crypto = require('crypto');
const axios = require('axios');

const momoPaymentMethod = async (transaction) => {
    //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
    var partnerCode = process.env.PARTNER_CODE;
    var accessKey = process.env.ACCESS_KEY;
    var secretkey = process.env.SECRECT_KEY;
    var requestId = partnerCode + new Date().getTime();
    var orderId = transaction._id;
    var orderInfo = transaction.description;
    var redirectUrl = `${process.env.URL_CLIENT}/payments/result`;
    var ipnUrl = `${process.env.URL_API}/payments/notify`;
    var amount = transaction.price;
    var requestType = process.env.REQUEST_TYPE;
    var extraData = '';

    //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
    var rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amount +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        ipnUrl +
        '&orderId=' +
        orderId +
        '&orderInfo=' +
        orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;
    //signature
    var signature = crypto.createHmac('sha256', secretkey).update(rawSignature).digest('hex');

    //json object send to MoMo endpoint
    const requestBody = JSON.stringify({
        partnerCode: partnerCode,
        accessKey: accessKey,
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: redirectUrl,
        ipnUrl: ipnUrl,
        extraData: extraData,
        requestType: requestType,
        signature: signature,
        lang: 'en',
    });
    //Create the HTTPS objects
    const options = {
        url: process.env.PAYMENT_MOMO_URL,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
        },
        data: requestBody,
    };

    const res = await axios(options);
    return res.data;
};

module.exports = momoPaymentMethod;
