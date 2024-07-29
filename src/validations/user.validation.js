const { objectIdValidator } = require('@/utils/functions');
const Joi = require('joi');

const updateProfileBody = Joi.object({
    fullName: Joi.string(),
    email: Joi.string().pattern(new RegExp('gmail.com$')).email(),
    gender: Joi.string().valid('male', 'female', 'other'),
    address: Joi.string(),
    phoneNumber: Joi.string(),
    picture: Joi.string(),
});
const blockUser = Joi.object({
    blockUserId: Joi.string().required().custom(objectIdValidator, 'ObjectId validation'),
});
module.exports = {
    updateProfileBody,
    blockUser,
};
