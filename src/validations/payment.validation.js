const Joi = require('joi');

const upgradeAccount = Joi.object({
    description: Joi.string().required(),
    price: Joi.number().required(),
});

module.exports = { upgradeAccount };
