const Joi = require('joi');

const { objectIdValidator, arrayUniqueValidator, arrayUniqueCreateGroupValidator } = require('@/utils/functions');
const { backgroundType } = require('@/enums/validates');

const createGroupBody = Joi.object({
    chatName: Joi.string().min(1).required(),
    avatar: Joi.string().optional(),
    background: Joi.string().optional(),
    users: Joi.array()
        .min(2)
        .items(Joi.string().custom(objectIdValidator, 'ObjectId validation'))
        .custom(arrayUniqueCreateGroupValidator, 'Array unique validation')
        .required(),
});

const addMemberGroupBody = Joi.object({
    groupId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    users: Joi.array()
        .items(Joi.string().custom(objectIdValidator, 'ObjectId validation'))
        .custom(arrayUniqueValidator, 'Array unique validation'),
});

const updateGroupBody = Joi.object({
    groupId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    chatName: Joi.string().min(1),
    avatar: Joi.string().min(1),
    background: Joi.object({
        url: Joi.string().min(1).optional(),
        backgroundType: Joi.string()
            .valid(...backgroundType)
            .optional(),
    }),
});

const deleteMemberGroupBody = Joi.object({
    groupId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    memberId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    exchangeAdmin: Joi.string().custom(objectIdValidator, 'ObjectId validation'),
});

const exchangeAdminGroupBody = Joi.object({
    groupId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
    exchangeAdmin: Joi.string().custom(objectIdValidator, 'ObjectId validation'),
});

module.exports = {
    createGroupBody,
    addMemberGroupBody,
    updateGroupBody,
    deleteMemberGroupBody,
    exchangeAdminGroupBody,
};
