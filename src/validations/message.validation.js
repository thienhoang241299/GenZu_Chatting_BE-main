const Joi = require('joi');
const { objectIdValidator, arrayUniqueValidator } = require('@/utils/functions');
const { languageTranslationCodes } = require('@/enums/validates');
const emojiRegex =
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FB}\u{25FC}\u{25FD}\u{25FE}\u{2B1B}\u{2B1C}\u{2B05}\u{2B06}\u{2B07}\u{2194}\u{2195}\u{2196}\u{2197}\u{2198}\u{2199}\u{21A9}\u{21AA}\u{21B5}\u{21B6}\u{21B7}\u{21B8}\u{21B9}\u{21BA}\u{21BB}\u{21BC}\u{21BD}\u{21BE}\u{21BF}\u{21C0}\u{21C1}\u{21C2}\u{21C3}\u{21C4}\u{21C5}\u{21C6}\u{21C7}\u{21C8}\u{21C9}\u{21CA}\u{21CB}\u{21CC}\u{21CD}\u{21CE}\u{21CF}\u{21D0}\u{21D1}\u{21D2}\u{21D3}\u{21D4}\u{21D5}\u{21D6}\u{21D7}\u{21D8}\u{21D9}\u{21DA}\u{21DB}\u{21DC}\u{21DD}\u{21DE}\u{21DF}\u{21E0}\u{21E1}\u{21E2}\u{21E3}\u{21E4}\u{21E5}\u{21E6}\u{21E7}\u{21E8}\u{21E9}\u{21EA}\u{21EB}\u{21EC}\u{21ED}\u{21EE}\u{21EF}\u{21F0}\u{21F1}\u{21F2}\u{21F3}\u{21F4}\u{21F5}\u{21F6}\u{21F7}\u{21F8}\u{21F9}\u{21FA}\u{21FB}\u{21FC}\u{21FD}\u{21FE}\u{21FF}]/u;

const getMessages = Joi.object({
    id: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    limit: Joi.number(),
    messageId: Joi.string(),
    search: Joi.string(),
    page: Joi.number(),
    startDate: Joi.date(),
    endDate: Joi.date(),
});

const searchMessages = Joi.object({
    id: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    sender: Joi.string().custom(objectIdValidator, 'ObjectId validation'),
    search: Joi.string(),
});

const sendMessage = Joi.object({
    message: Joi.string().min(1).required(),
    isSpoiled: Joi.boolean(),
    messageType: Joi.string().valid('text', 'image', 'video', 'notification', 'file', 'audio'),
    styles: Joi.object({
        fontSize: Joi.number(),
        bold: Joi.boolean(),
        italic: Joi.boolean(),
        underline: Joi.boolean(),
    }),
    replyMessage: Joi.string().allow('', null).custom(objectIdValidator, 'ObjectId validation'),
    emojiBy: Joi.array().items(Joi.string().pattern(emojiRegex)),
});

const sendMessage2 = Joi.object({
    conversationId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    message: Joi.string().min(1).required(),
    isSpoiled: Joi.boolean(),
    messageType: Joi.string().valid('text', 'image', 'video', 'notification', 'file', 'audio'),
    styles: Joi.object({
        fontSize: Joi.number(),
        bold: Joi.boolean(),
        italic: Joi.boolean(),
        underline: Joi.boolean(),
    }),
    emojiBy: Joi.array(),
    replyMessage: Joi.string().allow('', null).custom(objectIdValidator, 'ObjectId validation'),
});

const sendEmoji = Joi.object({
    emoji: Joi.string().required(),
});
const updateEmoji = Joi.object({
    newEmoji: Joi.string().required(),
});
const messageTranslate = Joi.object({
    languageCode: Joi.string()
        .valid(...languageTranslationCodes)
        .required(),
    messageIds: Joi.array()
        .min(1)
        .items(Joi.string().custom(objectIdValidator, 'ObjectId validation'))
        .custom(arrayUniqueValidator, 'Array unique validation'),
});

module.exports = {
    getMessages,
    sendMessage,
    sendEmoji,
    updateEmoji,
    searchMessages,
    sendMessage2,
    messageTranslate,
};
