const conversationSwagger = {
    '/conversations': {
        get: {
            tags: ['Conversation'],
            description: 'Get all conversations of user',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [],
            responses: {
                200: {
                    description: 'Get all conversation of users successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        post: {
            tags: ['Conversation'],
            description: 'Create single chat',
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
                                userId: {
                                    description: 'Id của người dùng mà bạn muốn nhắn tin',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Access conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        patch: {
            tags: ['Conversation'],
            description: 'Redo history conversation',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Redo history conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        delete: {
            tags: ['Conversation'],
            description: 'Delete history conversation by one side',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Delete history conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/{id}': {
        get: {
            tags: ['Conversation'],
            description: 'Get conversations by id',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Get conversation by id successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/background': {
        patch: {
            tags: ['Conversation'],
            description: 'Update background conversation',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                background: {
                                    description: 'Url của ảnh nền hội thoại',
                                    type: 'object',
                                    properties: {
                                        url: {
                                            type: 'string',
                                            example: '#ffff',
                                        },
                                        backgroundType: {
                                            type: 'string',
                                            example: 'color',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Update background conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/avatar': {
        patch: {
            tags: ['Conversation'],
            description: 'Update avatar conversation',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                avatar: {
                                    description: 'Url của ảnh đại diện hội thoại',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Update avatar conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/blockUsers': {
        patch: {
            tags: ['Conversation'],
            description: 'Block user',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                    },
                },
                {
                    name: 'blockUserId',
                    in: 'query',
                    description: 'Id of user',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Update avatar conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/unBlockUsers': {
        patch: {
            tags: ['Conversation'],
            description: 'Un block user',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                    },
                },
                {
                    name: 'blockUserId',
                    in: 'query',
                    description: 'Id of user',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Update avatar conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/autoTranslate/{id}': {
        patch: {
            tags: ['Conversation'],
            description: 'Api used to enable auto translation',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of conversation',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            requestBody: {
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                isAutoTranslate: {
                                    description: 'Status of auto translation',
                                    type: 'boolean',
                                    enum: [true, false],
                                    default: 'false',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Auto translate successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
};

module.exports = conversationSwagger;
