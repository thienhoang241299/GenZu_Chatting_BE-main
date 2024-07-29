const Joi = require('joi');

const getFriend = Joi.object({
    limit: Joi.number(),
    search: Joi.string(),
    startDate: Joi.date(),
    endDate: Joi.date(),
});

const sendAddFriendRequest = Joi.object({
    message: Joi.string().min(1).required(),
    isSpoiled: Joi.string(),
    messageType: Joi.string(),
    styles: Joi.object({
        fontSize: Joi.number(),
        bold: Joi.boolean(),
        italic: Joi.boolean(),
        underline: Joi.boolean(),
    }),
    //   sender_id: Joi.string().required(),
    //   conversation_id: Joi.string().required(),
    //   message_type: Joi.string().required(),
    //   status: Joi.string().required(),
});

module.exports = {
    getFriend,
    sendAddFriendRequest,
};
