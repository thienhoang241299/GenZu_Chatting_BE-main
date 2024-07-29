const jwt = require('jsonwebtoken');

const { createResponse } = require('@/utils/responseHelper');
const User = require('@/model/user.model');
const { STATUS_MESSAGE, MESSAGE_CODE, STATUS_CODE } = require('@/enums/response');

module.exports = function (token, socket) {
    let isError = true;
    try {
        if (!token) {
            socket.emit(
                'validation',
                createResponse(
                    null,
                    STATUS_MESSAGE.UNAUTHORIZED,
                    MESSAGE_CODE.UNAUTHORIZED,
                    STATUS_CODE.UNAUTHORIZED,
                    false,
                ),
            );
            return isError;
        }

        const accessToken = token.split(' ')[1];
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);

        if (!decoded) {
            socket.emit(
                'validation',
                createResponse(
                    null,
                    STATUS_MESSAGE.TOKEN_INVALID,
                    MESSAGE_CODE.TOKEN_INVALID,
                    STATUS_CODE.UNAUTHORIZED,
                    false,
                ),
            );
            return isError;
        }

        User.findById(decoded.data)
            .select('-password')
            .then((user) => {
                if (!user) {
                    socket.emit(
                        'validation',
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_NOT_REGISTERED,
                            MESSAGE_CODE.USER_NOT_REGISTERED,
                            STATUS_CODE.NOT_FOUND,
                            false,
                        ),
                    );
                    return isError;
                }

                if (!user.is_active) {
                    socket.emit(
                        'validation',
                        createResponse(
                            null,
                            STATUS_MESSAGE.ACCOUNT_INACTIVE,
                            MESSAGE_CODE.ACCOUNT_INACTIVE,
                            STATUS_CODE.FORBIDDEN,
                            false,
                        ),
                    );
                    return isError;
                }

                user.socketId.push(socket.id);
                user.is_online = true;
                user.save().then((newUser) => {
                    socket.user = newUser;
                    return false;
                });
            });
    } catch (error) {
        socket.emit('validation', createResponse(error, null, null, STATUS_CODE.UNAUTHORIZED, false));
        return isError;
    }
};
