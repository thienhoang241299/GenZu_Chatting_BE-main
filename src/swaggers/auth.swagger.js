const { languageCodes, languageTranslationCodes } = require('@/enums/validates');

const authSwagger = {
    '/auth/sign-up': {
        post: {
            tags: ['Auth'],
            description: 'Creating accounts for access',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                fullName: {
                                    description: 'Full name of the user',
                                    type: 'string',
                                },
                                address: {
                                    description: 'Address of the user',
                                    type: 'string',
                                },
                                phone_number: {
                                    description: 'Phone number of the user',
                                    type: 'string',
                                },
                                gender: {
                                    description: 'Gender of the user',
                                    type: 'string',
                                    default: 'male',
                                },
                                email: {
                                    description: 'Email of the user',
                                    type: 'string',
                                    example: 'string@gmail.com',
                                },
                                password: {
                                    description: 'Password of the user',
                                    type: 'string',
                                },
                                picture: {
                                    description: 'Picture for avatar',
                                    type: 'string',
                                    example:
                                        'https://thucungsaigon.com/timthumb.php?src=data/News/vi-sao-cho-thuong-hay-ngu-nhieu.jpg&h=400&w=760&q=100',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Creating accounts successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/sign-in': {
        post: {
            tags: ['Auth'],
            description: 'Verifying identity for personalized interactions and services',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: {
                                    description: 'Email of the user',
                                    type: 'string',
                                    example: 'string@gmail.com',
                                },
                                password: {
                                    description: 'Password of the user',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Login successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/sign-in-google': {
        get: {
            tags: ['Auth'],
            description: 'Verifying identity for personalized interactions and services with google',
            responses: {
                200: {
                    description: 'Login successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/refresh-token': {
        post: {
            tags: ['Auth'],
            description: 'Refresh token for access',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                refreshToken: {
                                    description: 'Refresh token of the user',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Refresh token successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/profile': {
        get: {
            tags: ['Auth'],
            description: 'Get profile successfully',
            security: [
                {
                    accessToken: [],
                },
            ],
            responses: {
                200: {
                    description: 'Get profile successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/resend-verify-email': {
        post: {
            tags: ['Auth'],
            description: 'Resend an email to verify',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: {
                                    description: 'Email of the user',
                                    type: 'string',
                                    example: 'string@gmail.com',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Resend a verify email successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/verify-email': {
        post: {
            tags: ['Auth'],
            description: 'Verify email',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                token: {
                                    description: 'Token for verify email',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Resend a verify email successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/change-password': {
        post: {
            tags: ['Auth'],
            description: 'Change password for user',
            security: [
                {
                    accessToken: [],
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                oldPassword: {
                                    description: 'Old password',
                                    type: 'string',
                                },
                                newPassword: {
                                    description: 'New password',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Change password successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/update-language': {
        patch: {
            tags: ['Auth'],
            description: 'Change language of user',
            security: [
                {
                    accessToken: [],
                },
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                language: {
                                    description: 'Language code',
                                    type: 'string',
                                    enum: languageCodes,
                                    default: 'vi',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Change language code successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/update-language-translate': {
        patch: {
            tags: ['Auth'],
            description: 'Change language translate of user',
            security: [
                {
                    accessToken: [],
                },
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                languageTranslate: {
                                    description: 'Language translate code',
                                    type: 'string',
                                    enum: languageTranslationCodes,
                                    default: 'vi',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Change language translate code successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/forgot-password': {
        post: {
            tags: ['Auth'],
            description: 'Forgot password for user',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: {
                                    description: 'Email of user',
                                    type: 'string',
                                    example: 'string@gmail.com',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Forgot password successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/verify-forgot-password': {
        post: {
            tags: ['Auth'],
            description: 'Verify forgot password for user',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                token: {
                                    description: 'Token for forgot password',
                                    type: 'string',
                                },
                                newPassword: {
                                    description: 'New password',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Forgot password successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/auth/logout': {
        delete: {
            tags: ['Auth'],
            description: 'Logout for user',
            responses: {
                200: {
                    description: 'Logout successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
};

module.exports = authSwagger;
