const paymentSwagger = {
    '/payments/upgrade_account': {
        post: {
            tags: ['Payment'],
            description: 'Get link for payment',
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
                                description: {
                                    description: 'Description of transaction',
                                    type: 'string',
                                },
                                price: {
                                    description: 'Price of transaction',
                                    type: 'number',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Get link for payment',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
};

module.exports = paymentSwagger;
