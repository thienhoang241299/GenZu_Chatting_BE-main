const groupSwagger = {
    '/conversations/group': {
        post: {
            tags: ['Group'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Create group chat',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                chatName: {
                                    description: 'Name of group chat',
                                    type: 'string',
                                },
                                users: {
                                    description: 'List user id of group chat',
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        description: 'User id of user',
                                    },
                                },
                                avatar: {
                                    description: 'Avatar of group chat',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Create group chat successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/add-member/group/{id}': {
        patch: {
            tags: ['Group'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Add member to group chat',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of group chat',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                users: {
                                    description: 'List user id you want to invate',
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        description: 'User id of user',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Add member to group chat successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/delete-member/group/{id}': {
        patch: {
            tags: ['Group'],
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of group chat',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                },
            ],
            description: 'Delete member to group chat',
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                memberId: {
                                    description: 'User id of group chat',
                                    type: 'string',
                                },
                                exchangeAdmin: {
                                    description: 'User id of group chat',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Delete member to group chat successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/conversations/group/{id}': {
        patch: {
            tags: ['Group'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Update group chat',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of group chat',
                    schema: {
                        type: 'string',
                    },
                    required: true,
                },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                chatName: {
                                    description: 'Name of group chat',
                                    type: 'string',
                                },
                                avatar: {
                                    description: 'Avatar of group chat',
                                    type: 'string',
                                },
                                background: {
                                    description: 'Background of group chat',
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Update group chat successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        delete: {
            tags: ['Group'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Delete group chat',
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    description: 'Id of group chat',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Delete group chat successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
};

module.exports = groupSwagger;
