const createHttpError = require('http-errors');

const { verifyToken } = require('../utils/functions');
const User = require('@/model/user.model');

module.exports = async function (req, res, next) {
    try {
        const authorization = req.headers.authorization;
        if (!authorization) {
            throw createHttpError.Unauthorized();
        }

        const token = authorization.split(' ')[1];
        const decoded = verifyToken(token, process.env.ACCESS_TOKEN_KEY);

        if (!decoded) {
            throw createHttpError(400, {
                message: 'Token invalid',
                message_code: 'token_invalid',
                success: false,
                status: 400,
            });
        }

        const user = await User.findById(decoded.data).select('-password');
        if (!user) {
            throw createHttpError(404, {
                message: 'User not found',
                message_code: 'user_not_found',
                success: false,
                status: 404,
            });
        }

        if (!user.is_active) {
            throw createHttpError(400, {
                messageCode: 'account_not_activated',
                message: 'Your account is not activated',
                success: false,
                status: 400,
            });
        }
        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};
