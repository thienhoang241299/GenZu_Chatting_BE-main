const createResponse = (data, message, messageCode, status, success) => {
    return {
        data,
        message,
        messageCode,
        status,
        success,
    };
};

const responseNotificationSocket = (data, actionCode, success) => {
    return {
        data,
        actionCode,
        success,
    };
};

module.exports = {
    createResponse,
    responseNotificationSocket,
};
