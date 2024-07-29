const { objectIdValidator } = require('@/utils/functions');
const Joi = require('joi');

const accessConversation = Joi.object({
    id: Joi.string().required(),
});

const fetchConversation = Joi.object({
    id: Joi.string().required(),
    message: Joi.string().min(1).required(),
    //   sender_id: Joi.string().required(),
    //   conversation_id: Joi.string().required(),
    //   message_type: Joi.string().required(),
    //   status: Joi.string().required(),
});
const updateBackgroundConversation = Joi.object({
    background: Joi.object({
        url: Joi.string().min(1).required(),
        backgroundType: Joi.string().min(1).required(),
    }),
});
const blockUserConversation = Joi.object({
    blockUserId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    id: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
});
const updateAvatarConversation = Joi.object({
    avatar: Joi.string().min(1).required(),
});
const autoTranslateConversation = Joi.object({
    isAutoTranslate: Joi.boolean().required(),
});

module.exports = {
    accessConversation,
    fetchConversation,
    updateBackgroundConversation,
    updateAvatarConversation,
    blockUserConversation,
    autoTranslateConversation,
};
