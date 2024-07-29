const friendSwagger = {
    '/friends': {
        get: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Get all friends (Lấy toàn bộ danh sách bạn bè)',
            responses: {
                200: {
                    description: 'Get all friends successfully',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },

        // put: {
        //     tags: ['Friend'],
        //     security: [
        //         {
        //             accessToken: [],
        //         },
        //     ],
        //     description: 'Update status of friend request (Cập nhật trạng thái lời mời kết bạn)',
        //     parameters: [
        //         {
        //             name: 'requestId',
        //             in: 'query',
        //             description: 'Request Id (Id của lời mời kết bạn)',
        //             schema: {
        //                 type: 'string',
        //             },
        //         },
        //         {
        //             name: 'statusRequest',
        //             in: 'query',
        //             description:
        //                 'Status of request that you want to update (Trạng thái của lời mời mà bạn muốn cập nhật)',
        //             schema: {
        //                 type: 'string',
        //             },
        //         },
        //     ],
        //     responses: {
        //         200: {
        //             description: 'Update status request successfully.',
        //             content: {
        //                 'application/json': {},
        //             },
        //         },
        //     },
        // },
    },
    '/friends/addFriendRequest': {
        get: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Get all friend request (Lấy danh sách lời mời kết bạn của người dùng)',
            responses: {
                200: {
                    description: 'Update status request successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        post: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Send add friend request to other user (Gửi lời mời kết bạn cho người dùng có Id __)',
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id of receiver (Id của người dùng bạn muốn gửi lời mời kết bạn)',
                    schema: {
                        type: 'string',
                        example: '667bbe7cd4df68dfbbd89a4c',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Send add friend request to other user successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/friends/addFriendRequestNotification': {
        get: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Get all friend request notification (Lấy danh sách thông báo lời mời kết bạn của người dùng)',
            responses: {
                200: {
                    description: 'Get all friend request notification successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/friends/acceptFriendRequest': {
        put: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Update status of friend request (Cập nhật trạng thái lời mời kết bạn)',
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Request Id (Id của lời mời kết bạn)',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Update status request successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/friends/rejectFriendRequest': {
        patch: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description:
                'Update status of friend request to reject (Cập nhật trạng thái lời mời kết bạn thành từ chối)',
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Request Id (Id của lời mời kết bạn)',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Update status request successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/friends/friendRequestHasBeenSent': {
        get: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Get all friend request has been sent(Lấy danh sách các lời mời kết bạn đã gửi)',
            responses: {
                200: {
                    description: 'Get all friend request has been sent successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
        delete: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Delete friend request which has been sent(Xóa lời mời kết bạn đã gửi)',
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Request Id (Id của lời mời kết bạn)',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Update status request successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },
    '/friends/deleteFriend': {
        delete: {
            tags: ['Friend'],
            security: [
                {
                    accessToken: [],
                },
            ],
            description: 'Delete friend (Xóa kết bạn)',
            parameters: [
                {
                    name: 'id',
                    in: 'query',
                    description: 'Id friend ship (Id của friend ship)',
                    schema: {
                        type: 'string',
                    },
                },
            ],
            responses: {
                200: {
                    description: 'Delete friend successfully.',
                    content: {
                        'application/json': {},
                    },
                },
            },
        },
    },

    // '/friends/sentFriendRequest': {
    //     get: {
    //         tags: ['Friend'],
    //         security: [
    //             {
    //                 accessToken: [],
    //             },
    //         ],
    //         description:
    //             'Get all request friend you have been sent (Lấy toàn bộ danh sách lời mời kết bạn mà bạn đã gửi)',
    //         responses: {
    //             200: {
    //                 description: 'Get all request add friends of user successful',
    //                 content: {
    //                     'application/json': {},
    //                 },
    //             },
    //         },
    //     },
    // },
    // '/friends/receivedFriendRequest': {
    //     get: {
    //         tags: ['Friend'],
    //         security: [
    //             {
    //                 accessToken: [],
    //             },
    //         ],
    //         description: 'Get all received add friend request (Lấy toàn bộ danh sách lời mời gửi đến bạn)',
    //         responses: {
    //             200: {
    //                 description: 'Get all request add friends of user successful',
    //                 content: {
    //                     'application/json': {},
    //                 },
    //             },
    //         },
    //     },
    // },
};

module.exports = friendSwagger;
