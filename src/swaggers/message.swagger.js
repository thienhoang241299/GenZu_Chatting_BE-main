const messageSwagger = {
    '/messages/{id}': {
        get: {
            tags: ['Message'],
            description: 'Get all message of conversation',
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
                    description: 'Get all message of conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/getMessagePagination': {
        get: {
            tags: ['Message'],
            description: 'Get all message of conversation',
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
                {
                    name: 'limit',
                    in: 'query',
                    description: 'limit of messages',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        example: 10,
                        description: 'The numbers of items to return (the default value is 20)',
                    },
                },
                {
                    name: 'messageId',
                    in: 'query',
                    description: 'Id of message',
                    schema: {
                        type: 'string',
                        description: 'The id of message',
                    },
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'search messages by keyword',
                    schema: {
                        type: 'string',
                        description: 'The numbers of items to return (the default value is 20)',
                    },
                },
                {
                    name: 'page',
                    in: 'query',
                    description: 'page of messages',
                    schema: {
                        type: 'integer',
                        description: 'Pagination page number (the default value is 1)',
                    },
                },
                {
                    name: 'startDate',
                    in: 'query',
                    description: 'The start date of range date you want to search',
                    schema: {
                        type: 'date',
                        description: 'Pagination page number (the default value is 1)',
                        example: '2024-06-30T07:00:00.000Z',
                    },
                },
                {
                    name: 'endDate',
                    in: 'query',
                    description: 'The end date of range date you want to search',
                    schema: {
                        type: 'date',
                        description: 'Pagination page number (the default value is 1)',
                        example: '2024-06-26T07:00:00.000Z',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Get all message of conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/searchMessage': {
        get: {
            tags: ['Message'],
            description: 'Search message by keyword',
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
                {
                    name: 'sender',
                    in: 'query',
                    description: 'Id of sender',
                    schema: {
                        type: 'string',
                        description: 'The id of sender',
                    },
                },
                {
                    name: 'search',
                    in: 'query',
                    description: 'search messages by keyword',
                    schema: {
                        type: 'string',
                        description: 'The numbers of items to return (the default value is 20)',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Get all message of conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/send': {
        post: {
            tags: ['Message'],
            description: 'Send message',
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
                                message: {
                                    description: 'Send message',
                                    type: 'string',
                                },
                                isSpoiled: {
                                    description: 'Spoiler',
                                    type: 'boolean',
                                    example: true,
                                },
                                messageType: {
                                    description: 'Type of message',
                                    type: 'string',
                                },
                                replyMessage: {
                                    description: 'Id of message you want to reply',
                                    type: 'string',
                                },
                                emojiBy: {
                                    description: 'Emoji by users',
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        description: 'User id of user',
                                    },
                                },
                                styles: {
                                    description: 'Styles of message',
                                    type: 'object',
                                    properties: {
                                        fontSize: {
                                            description: 'Font size',
                                            type: 'number',
                                            example: '10',
                                        },
                                        bold: {
                                            description: 'Bold',
                                            type: 'boolean',
                                            example: 'false',
                                        },
                                        italic: {
                                            description: 'Italic',
                                            type: 'boolean',
                                            example: 'false',
                                        },
                                        underline: {
                                            description: 'Underline',
                                            type: 'boolean',
                                            example: 'false',
                                        },
                                    },
                                },
                            },
                            required: ['message'],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Send message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/deleteMessageByOneSide': {
        patch: {
            tags: ['Message'],
            description: 'Delete message by one side',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of message',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Delete message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/emoji': {
        post: {
            tags: ['Message'],
            description: 'Add emoji message',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of message',
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
                                emoji: {
                                    description: 'Add emoji message',
                                    type: 'string',
                                    example: '😀',
                                },
                            },
                            required: ['message'],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Add emoji message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        patch: {
            tags: ['Message'],
            description: 'Update emoji message',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of emoji',
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
                                newEmoji: {
                                    description: 'Update emoji message',
                                    type: 'string',
                                    example: '😀',
                                },
                            },
                            required: ['message'],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Remove emoji message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        delete: {
            tags: ['Message'],
            description: 'Remove emoji message',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'emojiId',
                    in: 'query',
                    description: 'Id of emoji',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
                {
                    name: 'messageId',
                    in: 'query',
                    description: 'Id of emoji',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Remove emoji message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/recall': {
        delete: {
            tags: ['Message'],
            description: 'Recall message',
            security: [
                {
                    accessToken: [],
                },
            ],
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of message',
                    schema: {
                        type: 'string',
                        example: '6679c40ab0528a3618e7e646',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Recall message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/translate': {
        post: {
            tags: ['Message'],
            description: 'Translate message',
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
                                messageIds: {
                                    description: 'Message id needs translation',
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        description: 'id of message',
                                    },
                                },
                                languageCode: {
                                    description: 'Language translate code',
                                    type: 'string',
                                    example: 'en',
                                },
                            },
                            required: ['message'],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Translate message successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/images/{id}': {
        get: {
            tags: ['Message'],
            description: 'Get all image of conversation',
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
                    description: 'Get all images of conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/messages/videos/{id}': {
        get: {
            tags: ['Message'],
            description: 'Get all video of conversation',
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
                    description: 'Get all video of conversation successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
};

module.exports = messageSwagger;
