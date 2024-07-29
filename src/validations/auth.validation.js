const Joi = require('joi');

const { languageCodes, languageTranslationCodes } = require('@/enums/validates');

const signUpBody = Joi.object({
    fullName: Joi.string().min(2).required(),
    address: Joi.string().min(2),
    phone_number: Joi.string().min(2),
    gender: Joi.string().valid('male', 'female', 'other'),
    picture: Joi.string(),
    email: Joi.string().pattern(new RegExp('gmail.com$')).email().required(),
    password: Joi.string().min(6).max(30).required(),
});

const signInBody = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(30).required(),
});

const changePasswordBody = Joi.object({
    oldPassword: Joi.string().min(6).max(30).required(),
    newPassword: Joi.string().min(6).max(30).required(),
});

const changeLanguageBody = Joi.object({
    language: Joi.string()
        .valid(...languageCodes)
        .required(),
});

const changeLanguageTranslateBody = Joi.object({
    languageTranslate: Joi.string()
        .valid(...languageTranslationCodes)
        .required(),
});

const forgotPasswordBody = Joi.object({
    email: Joi.string().pattern(new RegExp('gmail.com$')).email().required(),
});

const verifyEmail = Joi.object({
    token: Joi.string().required(),
});

const refreshToken = Joi.object({
    refreshToken: Joi.string().required(),
});

const verifyForgotPasswordBody = Joi.object({
    token: Joi.string(),
    newPassword: Joi.string().min(6).max(30).required(),
});

module.exports = {
    signUpBody,
    signInBody,
    changePasswordBody,
    forgotPasswordBody,
    changeLanguageBody,
    verifyForgotPasswordBody,
    changeLanguageTranslateBody,
    verifyEmail,
    refreshToken,
};
