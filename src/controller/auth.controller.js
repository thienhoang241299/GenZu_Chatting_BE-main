const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');

const UserModel = require('@/model/user.model');
const { generateToken, verifyRefreshToken, sendEmail } = require('@/utils/functions');
const client = require('@/connections/redis');
const CONFIG = require('@/config');
const { createResponse } = require('@/utils/responseHelper');
const { STATUS_CODE, STATUS_MESSAGE, MESSAGE_CODE } = require('@/enums/response');

const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;

module.exports = {
    signUp: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ email: req.body.email });
            if (user) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.EMAIL_ALREADY_EXISTED,
                            MESSAGE_CODE.EMAIL_ALREADY_EXISTED,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const newUser = await UserModel.create({
                ...req.body,
                tokenEmailVerify: crypto.randomBytes(32).toString('hex'),
            });

            const link = `${process.env.URL_CLIENT}/verify/${newUser.tokenEmailVerify}`;

            await sendEmail(newUser.email, 'Verify email', link);

            return res
                .status(STATUS_CODE.CREATED)
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.PLEASE_VERIFY_EMAIL,
                        MESSAGE_CODE.PLEASE_VERIFY_EMAIL,
                        STATUS_CODE.CREATED,
                        false,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    signIn: async (req, res, next) => {
        try {
            const user = await UserModel.findOne({ email: req.body.email });
            if (!user) {
                return res
                    .status(STATUS_CODE.NOT_FOUND)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.EMAIL_NOT_FOUND,
                            MESSAGE_CODE.EMAIL_NOT_FOUND,
                            STATUS_CODE.NOT_FOUND,
                            false,
                        ),
                    );
            }

            const isValid = user.checkPassword(req.body.password);
            if (!isValid) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.INCORRECT_PASSWORD,
                            MESSAGE_CODE.INCORRECT_PASSWORD,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            if (!user.is_active) {
                return res
                    .status(STATUS_CODE.FORBIDDEN)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.ACCOUNT_INACTIVE,
                            MESSAGE_CODE.ACCOUNT_INACTIVE,
                            STATUS_CODE.FORBIDDEN,
                            false,
                        ),
                    );
            }

            const { password, ...remain } = user._doc;
            const accessToken = generateToken(user._id, process.env.ACCESS_TOKEN_KEY, process.env.EXPIRE_ACCESS_TOKEN);
            const refreshToken = generateToken(
                user._id,
                process.env.REFRESH_TOKEN_KEY,
                process.env.EXPIRE_REFRESH_TOKEN,
            );
            await client.set(String(user._id), refreshToken, {
                PX: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
            });

            return res
                .status(STATUS_CODE.OK)
                .cookie('refreshToken', refreshToken, {
                    maxAge: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    httpOnly: true, // không thể được truy cập bởi JavaScript
                    secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                })
                .json(
                    createResponse(
                        {
                            user: remain,
                            accessToken,
                            refreshToken,
                            maxAgeAt: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                            maxAgeRt: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                            success: true,
                        },
                        STATUS_MESSAGE.LOGIN_SUCCESSFULLY,
                        MESSAGE_CODE.LOGIN_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    signInWithGoogle: (req, res, next) => {
        try {
            const oauth2Client = new OAuth2(
                CONFIG.oauth2Credentials.client_id,
                CONFIG.oauth2Credentials.client_secret,
                CONFIG.oauth2Credentials.redirect_uris[0],
            );
            // Obtain the google login link to which we'll send our users to give us access
            const loginLink = oauth2Client.generateAuthUrl({
                access_type: 'offline', // Indicates that we need to be able to access data continously without the user constantly giving us consent
                scope: CONFIG.oauth2Credentials.scopes, // Using the access scopes from our config file
            });
            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        loginLink,
                        STATUS_MESSAGE.LOGIN_GOOGLE_SUCCESSFULLY,
                        MESSAGE_CODE.LOGIN_GOOGLE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    callBack: (req, res) => {
        // Create an OAuth2 client object from the credentials in our config file
        const oauth2Client = new OAuth2(
            CONFIG.oauth2Credentials.client_id,
            CONFIG.oauth2Credentials.client_secret,
            CONFIG.oauth2Credentials.redirect_uris[0],
        );
        if (req.query.error) {
            // The user did not give us permission.
            return res.redirect(`${process.env.URL_CLIENT}/login?err=${req.query.error}&success=false`);
        } else {
            oauth2Client.getToken(req.query.code, async function (err, token) {
                if (err) return res.redirect(`${process.env.URL_CLIENT}/login?err=${err}&success=false`);
                // Store the credentials given by google into a jsonwebtoken in a cookie called 'jwt'

                const userInfo = jwt.decode(token.id_token);
                const user = await UserModel.findOne({
                    $or: [{ email: userInfo.email }, { googleId: userInfo.sub }],
                }).select('email_verified is_active googleId tokenGoogle _id email');

                if (user?.email) {
                    user.email_verified = userInfo.email_verified;
                    user.is_active = userInfo.email_verified;
                    user.googleId = userInfo.sub;
                    user.tokenGoogle = token;

                    const newUser = await user.save();
                    const accessToken = generateToken(
                        newUser._id,
                        process.env.ACCESS_TOKEN_KEY,
                        process.env.EXPIRE_ACCESS_TOKEN,
                    );
                    const refreshToken = generateToken(
                        newUser._id,
                        process.env.REFRESH_TOKEN_KEY,
                        process.env.EXPIRE_REFRESH_TOKEN,
                    );
                    await client.set(String(newUser._id), refreshToken, {
                        PX: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    });

                    return res
                        .cookie('refreshToken', refreshToken, {
                            maxAge: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .cookie('accessToken', accessToken, {
                            maxAge: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .redirect(
                            `${process.env.URL_CLIENT}/verify-login-google?err=${err}&at=${accessToken}&rt=${refreshToken}&maxAgeAt=${process.env.EXPIRE_ACCESS_TOKEN_COOKIE}&maxAgeRt${process.env.EXPIRE_REFRESH_TOKEN_COOKIE}&success=true`,
                        );
                } else if (user?.googleId) {
                    const accessToken = generateToken(
                        user._id,
                        process.env.ACCESS_TOKEN_KEY,
                        process.env.EXPIRE_ACCESS_TOKEN,
                    );
                    const refreshToken = generateToken(
                        user._id,
                        process.env.REFRESH_TOKEN_KEY,
                        process.env.EXPIRE_REFRESH_TOKEN,
                    );
                    await client.set(String(user._id), refreshToken, {
                        PX: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    });

                    return res
                        .status(200)
                        .cookie('refreshToken', refreshToken, {
                            maxAge: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .cookie('accessToken', accessToken, {
                            maxAge: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .redirect(
                            `${process.env.URL_CLIENT}/verify-login-google?err=${err}&at=${accessToken}&rt=${refreshToken}&maxAgeAt=${process.env.EXPIRE_ACCESS_TOKEN_COOKIE}&maxAgeRt${process.env.EXPIRE_REFRESH_TOKEN_COOKIE}&success=true`,
                        );
                } else {
                    const newUser = await UserModel.create({
                        fullName: userInfo.name,
                        picture: userInfo.picture,
                        email: userInfo.email,
                        email_verified: userInfo.email_verified,
                        is_active: userInfo.email_verified,
                        googleId: userInfo.sub,
                        tokenGoogle: token,
                    });
                    const accessToken = generateToken(
                        newUser._id,
                        process.env.ACCESS_TOKEN_KEY,
                        process.env.EXPIRE_ACCESS_TOKEN,
                    );
                    const refreshToken = generateToken(
                        newUser._id,
                        process.env.REFRESH_TOKEN_KEY,
                        process.env.EXPIRE_REFRESH_TOKEN,
                    );
                    await client.set(String(newUser._id), refreshToken, {
                        PX: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    });

                    return res
                        .cookie('refreshToken', refreshToken, {
                            maxAge: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .cookie('accessToken', accessToken, {
                            maxAge: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                            httpOnly: true, // không thể được truy cập bởi JavaScript
                            secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                        })
                        .redirect(
                            `${process.env.URL_CLIENT}/verify-login-google?err=${err}&at=${accessToken}&rt=${refreshToken}&maxAgeAt=${process.env.EXPIRE_ACCESS_TOKEN_COOKIE}&maxAgeRt${process.env.EXPIRE_REFRESH_TOKEN_COOKIE}&success=true`,
                        );
                }
            });
        }
    },
    refreshToken: async (req, res, next) => {
        try {
            const decoded = verifyRefreshToken(req.body.refreshToken, process.env.REFRESH_TOKEN_KEY);

            const value = await client.get(decoded.data);

            if (!value) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.REFRESH_TOKEN_INVALID,
                            MESSAGE_CODE.REFRESH_TOKEN_INVALID,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const accessToken = generateToken(
                decoded.data,
                process.env.ACCESS_TOKEN_KEY,
                process.env.EXPIRE_ACCESS_TOKEN,
            );
            const refreshToken = generateToken(
                decoded.data,
                process.env.REFRESH_TOKEN_KEY,
                process.env.EXPIRE_REFRESH_TOKEN,
            );
            return res
                .status(STATUS_CODE.OK)
                .cookie('refreshToken', refreshToken, {
                    maxAgeAt: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                    maxAgeRt: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    httpOnly: true, // không thể được truy cập bởi JavaScript
                    secure: true, // đảm bảo rằng cookies chỉ được gửi qua các kết nối an toàn (HTTPS)
                })
                .json(
                    createResponse(
                        {
                            accessToken,
                            refreshToken,
                            maxAgeAt: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                            maxAgeRt: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                        },
                        STATUS_MESSAGE.REFRESH_TOKEN_SUCCESSFULLY,
                        MESSAGE_CODE.REFRESH_TOKEN_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    profile: async (req, res, next) => {
        try {
            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        req.user,
                        STATUS_MESSAGE.GET_PROFILE_SUCCESSFULLY,
                        MESSAGE_CODE.GET_PROFILE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    changeLanguage: async (req, res, next) => {
        const user = req.user;
        const languageCode = req.body.language;

        try {
            if (user.language === languageCode) {
                res.status(STATUS_CODE.BAD_REQUEST).json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.SAME_LANGUAGE_CODE,
                        MESSAGE_CODE.SAME_LANGUAGE_CODE,
                        STATUS_CODE.BAD_REQUEST,
                        false,
                    ),
                );
            }

            const newUser = await UserModel.findByIdAndUpdate(
                user._id,
                { language: languageCode },
                { new: true },
            ).select('-password');

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        newUser,
                        STATUS_MESSAGE.CHANGE_LANGUAGE_CODE_SUCCESSFULLY,
                        MESSAGE_CODE.CHANGE_LANGUAGE_CODE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    changeLanguageTranslation: async (req, res, next) => {
        const user = req.user;
        const languageCode = req.body.languageTranslate;

        try {
            if (user.languageTranslate === languageCode) {
                res.status(STATUS_CODE.BAD_REQUEST).json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.SAME_LANGUAGE_CODE,
                        MESSAGE_CODE.SAME_LANGUAGE_CODE,
                        STATUS_CODE.BAD_REQUEST,
                        false,
                    ),
                );
            }

            const newUser = await UserModel.findByIdAndUpdate(
                user._id,
                { languageTranslate: languageCode },
                { new: true },
            ).select('-password');

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        newUser,
                        STATUS_MESSAGE.CHANGE_LANGUAGE_CODE_SUCCESSFULLY,
                        MESSAGE_CODE.CHANGE_LANGUAGE_CODE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    resendVerifyEmail: async (req, res) => {
        try {
            const user = await UserModel.findOne({ email: req.body.email }).select('-password');

            if (!user) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_NOT_REGISTERED,
                            MESSAGE_CODE.USER_NOT_REGISTERED,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }
            const currentTimestamp = moment().unix();
            const thresholdTimestamp = user.timeResendVerifyEmail + 120;
            const remainingSeconds = thresholdTimestamp - currentTimestamp;

            if (remainingSeconds > 0) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            remainingSeconds,
                            'Please wait in ' + remainingSeconds,
                            MESSAGE_CODE.PLEASE_WAIT,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            if (user.email_verified) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.VERIFIED_EMAIL,
                            MESSAGE_CODE.VERIFIED_EMAIL,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            user.tokenEmailVerify = crypto.randomBytes(32).toString('hex');
            user.timeResendVerifyEmail = moment().unix();
            const newUser = await user.save();

            const link = `${process.env.URL_CLIENT}/verify/${newUser.tokenEmailVerify}`;

            const result = await sendEmail(newUser.email, 'Verify email', link);

            if (!result) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.EMAIL_NOT_FOUND,
                            MESSAGE_CODE.EMAIL_NOT_FOUND,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.RESEND_EMAIL_SUCCESSFULLY,
                        MESSAGE_CODE.RESEND_EMAIL_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    verifyEmail: async (req, res) => {
        try {
            const user = await UserModel.findOne({ tokenEmailVerify: req.body.token }).select('-password');

            if (!user) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.TOKEN_INVALID,
                            MESSAGE_CODE.TOKEN_INVALID,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            if (user.email_verified) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.VERIFIED_EMAIL,
                            MESSAGE_CODE.VERIFIED_EMAIL,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            user.is_active = true;
            user.email_verified = true;

            const newUser = await user.save();

            const accessToken = generateToken(
                newUser._id,
                process.env.ACCESS_TOKEN_KEY,
                process.env.EXPIRE_ACCESS_TOKEN,
            );
            const refreshToken = generateToken(
                newUser._id,
                process.env.REFRESH_TOKEN_KEY,
                process.env.EXPIRE_REFRESH_TOKEN,
            );
            await client.set(String(newUser._id), refreshToken, {
                PX: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
            });

            return res.status(STATUS_CODE.OK).json(
                createResponse(
                    {
                        accessToken,
                        refreshToken,
                        maxAgeAt: Number(process.env.EXPIRE_ACCESS_TOKEN_COOKIE),
                        maxAgeRt: Number(process.env.EXPIRE_REFRESH_TOKEN_COOKIE),
                    },
                    STATUS_MESSAGE.VERIFY_EMAIL_SUCCESSFULLY,
                    MESSAGE_CODE.VERIFY_EMAIL_SUCCESSFULLY,
                    STATUS_CODE.OK,
                    false,
                ),
            );
        } catch (error) {
            next(error);
        }
    },
    changePassword: async (req, res) => {
        try {
            const userId = req.user._id;
            const newPassword = req.body.newPassword;

            const user = await UserModel.findById(userId).select('password');
            const isValid = user.checkPassword(req.body.oldPassword);

            if (!isValid) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.INCORRECT_PASSWORD,
                            MESSAGE_CODE.INCORRECT_PASSWORD,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const isValidNewPassword = user.checkPassword(newPassword);
            if (isValidNewPassword) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.SAME_OLD_PASSWORD,
                            MESSAGE_CODE.SAME_OLD_PASSWORD,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            user.password = req.body.newPassword;
            await user.save();

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.CHANGE_PASSWORD_SUCCESSFULLY,
                        MESSAGE_CODE.CHANGE_PASSWORD_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const user = await UserModel.findOne({ email: req.body.email }).select('-password');
            if (!user) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_NOT_REGISTERED,
                            MESSAGE_CODE.USER_NOT_REGISTERED,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const currentTimestamp = moment().unix();
            const thresholdTimestamp = user.timeResendForgotPassword + 120;
            const remainingSeconds = thresholdTimestamp - currentTimestamp;

            if (remainingSeconds > 0) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            remainingSeconds,
                            'Please wait in ' + remainingSeconds,
                            MESSAGE_CODE.PLEASE_WAIT,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            user.tokenVerifyForgotPassword = crypto.randomBytes(32).toString('hex');
            user.timeResendForgotPassword = moment().unix();
            const newUser = await user.save();

            const link = `${process.env.URL_CLIENT}/login/forgot/${newUser.tokenVerifyForgotPassword}`;

            const result = await sendEmail(newUser.email, 'Forgot password', link);

            if (!result) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.EMAIL_NOT_FOUND,
                            MESSAGE_CODE.EMAIL_NOT_FOUND,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.FORGOT_PASSWORD_SUCCESSFULLY,
                        MESSAGE_CODE.FORGOT_PASSWORD_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    verifyForgotPassword: async (req, res) => {
        try {
            const user = await UserModel.findOne({ tokenVerifyForgotPassword: req.body.token });
            if (!user) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.TOKEN_INVALID,
                            MESSAGE_CODE.TOKEN_INVALID,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            user.password = req.body.newPassword;
            user.tokenVerifyForgotPassword = null;

            if (!user.email_verified) {
                user.is_active = true;
                user.email_verified = true;
            }

            await user.save();

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.CHANGE_PASSWORD_SUCCESSFULLY,
                        MESSAGE_CODE.CHANGE_PASSWORD_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    logout: async (req, res, next) => {
        try {
            const decoded = verifyRefreshToken(req.cookies.refreshToken, process.env.REFRESH_TOKEN_KEY);

            await client.del(decoded.data);

            return res
                .status(STATUS_CODE.OK)
                .cookie('refreshToken', '', {
                    maxAge: 0,
                })
                .json(
                    createResponse(
                        null,
                        STATUS_MESSAGE.LOGOUT_SUCCESSFULLY,
                        MESSAGE_CODE.LOGOUT_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
};
