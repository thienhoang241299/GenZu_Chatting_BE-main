const mongodb = require('mongodb');

const Conversation = require('../model/conversation.model');
const FriendShip = require('../model/friendShip.model');
const Message = require('../model/message.model');
const User = require('../model/user.model');
const MESSAGE_CODE = require('@/enums/response/messageCode.enum');
const STATUS_MESSAGE = require('@/enums/response/statusMessage.enum');
const { createResponse } = require('@/utils/responseHelper');
const { STATUS_CODE } = require('@/enums/response');

module.exports = {
    accessConversation: async (req, res, next) => {
        const { userId } = req.body;
        const userIdAccess = req.user._id;
        if (!userId) {
            console.log('UserId param not sent with request');
            return res.sendStatus(400);
        }
        if (!mongodb.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'The user id is invalid',
                messageCode: 'invalid_userId',
            });
        }
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res
                .status(400)
                .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
        }
        const isFriend = await FriendShip.findOne({ users: { $all: [userId, req.user._id] }, status: 'active' });
        if (!isFriend) {
            return res.status(200).json({
                message: 'Your are not a friend, pls add friend before send message',
                messageCode: 'not_a_friend',
                status: 1002,
            });
        }
        var isChat = await Conversation.findOne({
            isGroupChat: false,
            $and: [{ users: { $elemMatch: { $eq: req.user._id } } }, { users: { $elemMatch: { $eq: userId } } }],
        })
            .populate('users', '-password')
            .populate('latestMessage');
        isChat = await User.populate(isChat, {
            path: 'latestMessage.sender',
            select: 'fullName picture email',
        });

        if (isChat) {
            const conversationUpdate = await Conversation.findByIdAndUpdate(
                { _id: isChat._id },
                { $pull: { deleteBy: userIdAccess } },
                { new: true },
            );

            res.status(200).json(
                createResponse(
                    isChat,
                    STATUS_MESSAGE.CONVERSATION_ACCESS_SUCCESSFULLY,
                    MESSAGE_CODE.CONVERSATION_ACCESS_SUCCESSFULLY,
                    STATUS_CODE.OK,
                    true,
                ),
            );
        } else {
            var chatData = {
                chatName: 'sender',
                isGroupChat: false,
                users: [req.user._id, userId],
            };
            try {
                const createdChat = await Conversation.create(chatData);
                const FullChat = await Conversation.findOne({
                    _id: createdChat._id,
                }).populate('users', '-password');
                res.status(201).json(
                    createResponse(
                        FullChat,
                        STATUS_MESSAGE.CONVERSATION_CREATE_SUCCESSFULLY,
                        MESSAGE_CODE.CONVERSATION_CREATE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
            } catch (error) {
                res.status(400);
                throw new Error(error.message);
            }
        }
    },
    getConversations: async (req, res, next) => {
        try {
            const user_id = req.user._id;
            if (!mongodb.ObjectId.isValid(user_id)) {
                return res.status(400).json({
                    message: 'The user id is invalid',
                    messageCode: 'invalid_userId',
                });
            }
            // const senderId = req.user._id ;

            const conversations = await Conversation.find({
                'user.user_id': req.user?._id,
            });

            if (!conversations) {
                return res.status(200).json({
                    message: 'Get conversations was successfully.',
                    messageCode: 'get_conversations_SUCCESSFULLYfully',
                    data: [],
                });
            }
            return res.status(200).json({
                message: 'Get conversations was successfully',
                messageCode: 'get_conversations_SUCCESSFULLYfully',
                data: conversations,
            });
        } catch (error) {
            next(error);
        }
    },
    fetchConversation: async (req, res, next) => {
        try {
            const userId = req.user._id;
            Conversation.find({ users: { $elemMatch: { $eq: req.user._id } }, deleteBy: { $nin: userId } })
                .populate('users', 'email fullName picture is_online offline_at')
                .populate('groupAdmin', '-password')
                .populate('latestMessage')
                .sort({ updatedAt: -1 })
                .then(async (results) => {
                    if (!results) {
                        return res
                            .status(400)
                            .json(
                                createResponse(
                                    null,
                                    STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                                    MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                                    false,
                                ),
                            );
                    }
                    results = await User.populate(results, {
                        path: 'latestMessage.sender',
                        select: 'fullName picture email',
                    });
                    results = results.map((conversation) => {
                        if (conversation.latestMessage && conversation.latestMessage.status === 'recalled') {
                            conversation.latestMessage.message = 'This message has been recalled';
                        }
                        return conversation;
                    });

                    res.status(200).send(results);
                });
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    },
    getConversationById: async (req, res, next) => {
        try {
            Conversation.findById(req.params.id)
                .populate('users', 'email fullName picture is_online offline_at')
                .populate('groupAdmin', '-password')
                .populate('latestMessage')
                .sort({ updatedAt: -1 })
                .then(async (result) => {
                    if (!result) {
                        return res
                            .status(400)
                            .json(
                                createResponse(
                                    null,
                                    STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                                    MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                                    false,
                                ),
                            );
                    }
                    result = await User.populate(result, {
                        path: 'latestMessage.sender',
                        select: 'fullName picture email',
                    });

                    if (result.latestMessage && result.latestMessage.status === 'recalled') {
                        result.latestMessage.message = 'This message has been recalled';
                    }

                    res.status(200).send(result);
                });
        } catch (error) {
            res.status(400);
            throw new Error(error.message);
        }
    },
    createGroupConversation: async (req, res, next) => {
        const userId = req.user._id;
        if (!req.body.users || !req.body.name) {
            return res.status(400).send({ message: 'Please Fill all the field!' });
        }
        var users = JSON.parse(req.body.users);

        if (users.length < 2) {
            return res.status(400).send({ message: 'Please add more than 1 user to create a group chat!' });
        }

        users.push(userId);

        try {
            const groupChat = await Conversation.create({
                chatName: req.body.name,
                isGroupChat: true,
                users: users,
                groupAdmin: userId,
            });
            const fullGroupChatInfo = await Conversation.findOne({
                _id: groupChat._id,
            })
                .populate('users', 'picture fullName _id email')
                .populate('groupAdmin', 'picture fullName _id email');
            return res.status(201).json({
                data: fullGroupChatInfo,
                message: 'Create group chat successful',
                messageCode: 'create_group_chat_SUCCESSFULLYful',
            });
        } catch (error) {
            next(error);
        }
    },
    removeConversation: async (req, res, next) => {
        const conversationId = req.query.conversationId;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(userId) || !mongodb.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const conversation = await Conversation.findByIdAndUpdate(
                { conversationId },
                { $push: { deleteBy: userId } },
            );

            if (!conversation) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }
            if (!conversation.users.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_REMOVE_HISTORY_CONVERSATION,
                            MESSAGE_CODE.NO_PERMISSION_REMOVE_HISTORY_CONVERSATION,
                            false,
                        ),
                    );
            }
            const messageUpdate = await Message.updateMany(
                { conversation: conversationId },
                { $push: { deleteBy: userId } },
            );

            return res.status(200).json({
                data: conversation,
                message: STATUS_MESSAGE.REMOVE_CONVERSATION_SUCCESSFULLY,
            });
        } catch (error) {
            next(error);
        }
    },
    removeHistoryConversation: async (req, res, next) => {
        const conversationId = req.query.id;
        const userId = req.user._id;
        try {
            const conversation = await Conversation.findByIdAndUpdate(
                { _id: conversationId },
                { $push: { deleteBy: userId } },
            );

            if (!conversation) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }
            if (!conversation.users.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_REMOVE_HISTORY_CONVERSATION,
                            MESSAGE_CODE.NO_PERMISSION_REMOVE_HISTORY_CONVERSATION,
                            false,
                        ),
                    );
            }
            const messageUpdate = await Message.updateMany(
                { conversation: conversationId },
                { $push: { deleteBy: userId } },
            );
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.DELETE_CONVERSATION_HISTORY_SUCCESSFULLY,
                        MESSAGE_CODE.DELETE_CONVERSATION_HISTORY_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    redoHistoryConversation: async (req, res, next) => {
        const conversationId = req.query.id;
        const userId = req.user._id;
        try {
            const messageUpdate = await Message.updateMany(
                { conversation: conversationId },
                { $pull: { deleteBy: userId } },
            );
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.REDO_CONVERSATION_HISTORY_SUCCESSFULLY,
                        MESSAGE_CODE.REDO_CONVERSATION_HISTORY_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    updateConversationBackground: async (req, res, next) => {
        const conversationId = req.query.id;
        const background = req.body.background;
        const { url, backgroundType } = background;
        const userId = req.user._id;
        try {
            const users = await Conversation.findOne({ _id: conversationId }).select('users blockedUsers');
            const user = await User.findOne({ _id: userId });
            if (!users) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }

            if (!users?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_UPDATE_BACKGROUND,
                            MESSAGE_CODE.NO_PERMISSION_UPDATE_BACKGROUND,
                            false,
                        ),
                    );
            }
            const isUserBlocked = users.blockedUsers.some((item) => item.equals(userId));
            if (isUserBlocked) {
                return res
                    .status(409)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_WAS_BLOCKED,
                            MESSAGE_CODE.USER_WAS_BLOCKED,
                            STATUS_CODE.CONFLICT,
                            false,
                        ),
                    );
            }
            if (users?.blockedUsers?.length > 0) {
                return res
                    .status(409)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_WAS_BLOCKED,
                            MESSAGE_CODE.CONVERSATION_WAS_BLOCKED,
                            STATUS_CODE.CONFLICT,
                            false,
                        ),
                    );
            }
            const messageCreate = {
                sender: userId,
                message: MESSAGE_CODE.UPDATE_BACKGROUND_CONVERSATION_SUCCESSFULLY,
                conversation: conversationId,
                status: 'active',
                messageType: 'notification',
            };

            var message = await Message.create(messageCreate);
            message = await message.populate('sender', 'fullName picture email');
            message = await message.populate('conversation');
            message = await User.populate(message, {
                path: 'conversation.users',
                select: 'fullName picture email',
            });

            const conversationUpdate = await Conversation.findByIdAndUpdate(
                { _id: conversationId },
                {
                    background: { url: url, backgroundType: backgroundType },
                    latestMessage: message._id,
                },
                { new: true },
            );
            const result = {
                message,
                conversationUpdate,
            };

            return res
                .status(200)
                .json(
                    createResponse(
                        result,
                        STATUS_MESSAGE.UPDATE_BACKGROUND_CONVERSATION_SUCCESSFULLY,
                        MESSAGE_CODE.UPDATE_BACKGROUND_CONVERSATION_SUCCESSFULLY,
                        STATUS_CODE.CREATED,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    updateConversationAvatar: async (req, res, next) => {
        const conversationId = req.query.id;
        const avatar = req.body.avatar;
        const userId = req.user._id;
        try {
            const users = await Conversation.findOne({ _id: conversationId }).select('users');
            if (!users) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }

            if (!users?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_UPDATE_AVATAR,
                            MESSAGE_CODE.NO_PERMISSION_UPDATE_AVATAR,
                            false,
                        ),
                    );
            }
            const conversationUpdate = await Conversation.findByIdAndUpdate(
                { _id: conversationId },
                { avatar: avatar },
                { new: true },
            );

            return res
                .status(200)
                .json(
                    createResponse(
                        conversationUpdate,
                        STATUS_MESSAGE.UPDATE_AVATAR_CONVERSATION_SUCCESSFULLY,
                        MESSAGE_CODE.UPDATE_AVATAR_CONVERSATION_SUCCESSFULLY,
                        STATUS_CODE.CREATED,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    blockUserConversation: async (req, res, next) => {
        const userId = req.user._id;
        const conversationId = req.query.id;
        const userBlockId = req.query.blockUserId;
        try {
            const users = await Conversation.findById({ _id: conversationId }).select('users');
            const user = await User.findById({ _id: userBlockId });
            if (!users) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }

            if (!user) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
            }

            if (users.blockUser.includes(userBlockId)) {
                return res
                    .status(403)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.USER_AlREADY_BLOCKED,
                            MESSAGE_CODE.USER_AlREADY_BLOCKED,
                            false,
                        ),
                    );
            }

            if (!users?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_BLOCK_USER,
                            MESSAGE_CODE.NO_PERMISSION_BLOCK_USER,
                            false,
                        ),
                    );
            }

            const conversationUpdate = await Conversation.findByIdAndUpdate(
                { _id: conversationId },
                {
                    $push: { blockedUsers: [userBlockId] },
                },
                {
                    new: true,
                },
            );
            return res
                .status(200)
                .json(
                    createResponse(
                        conversationUpdate,
                        STATUS_MESSAGE.BLOCK_USER_SUCCESSFULLY,
                        MESSAGE_CODE.BLOCK_USER_SUCCESSFULLY,
                        true,
                    ),
                );
        } catch (error) {}
    },
    unBlockUserConversation: async (req, res, next) => {
        const userId = req.user._id;
        const conversationId = req.query.id;
        const userBlockId = req.query.blockUserId;
        try {
            const users = await Conversation.findById({ _id: conversationId }).select('users');
            const user = await User.findById({ _id: userBlockId });
            if (!users) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                            MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                            false,
                        ),
                    );
            }

            if (!user) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
            }
            if (!users?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_UN_BLOCK_USER,
                            MESSAGE_CODE.NO_PERMISSION_UN_BLOCK_USER,
                            false,
                        ),
                    );
            }

            const conversationUpdate = await Conversation.findByIdAndUpdate(
                { _id: conversationId },
                {
                    $pull: { blockedUsers: userBlockId },
                },
                {
                    new: true,
                },
            );
            return res
                .status(200)
                .json(
                    createResponse(
                        conversationUpdate,
                        STATUS_MESSAGE.UN_BLOCK_USER_SUCCESSFULLY,
                        MESSAGE_CODE.UN_BLOCK_USER_SUCCESSFULLY,
                        true,
                    ),
                );
        } catch (error) {}
    },
    autoTranslate: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const conversationId = req.params.id;
            const isAutoTranslate = req.body.isAutoTranslate;

            const conversation = await Conversation.findById(conversationId).select('autoTranslateList');

            if (!conversation) {
                return res
                    .status(STATUS_CODE.NOT_FOUND)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.GROUP_NOT_FOUND,
                            MESSAGE_CODE.GROUP_NOT_FOUND,
                            STATUS_CODE.NOT_FOUND,
                            false,
                        ),
                    );
            }

            const isAutoTranslateUserList = conversation.autoTranslateList.find((item) => item.equals(userId));

            if (isAutoTranslateUserList) {
                if (isAutoTranslate) {
                    return res
                        .status(STATUS_CODE.BAD_REQUEST)
                        .json(
                            createResponse(
                                null,
                                STATUS_MESSAGE.USER_ALREADY_ENABLE_TRANSLATE,
                                MESSAGE_CODE.USER_ALREADY_ENABLE_TRANSLATE,
                                STATUS_CODE.BAD_REQUEST,
                                false,
                            ),
                        );
                } else {
                    conversation.autoTranslateList = conversation.autoTranslateList.filter(
                        (item) => !item.equals(userId),
                    );
                    const newConversation = await conversation.save();
                    return res
                        .status(STATUS_CODE.OK)
                        .json(
                            createResponse(
                                newConversation,
                                STATUS_MESSAGE.ENABLE_TRANSLATE_SUCCESSFULLY,
                                MESSAGE_CODE.ENABLE_TRANSLATE_SUCCESSFULLY,
                                STATUS_CODE.OK,
                                true,
                            ),
                        );
                }
            } else {
                if (isAutoTranslate) {
                    conversation.autoTranslateList.push(userId);
                    const newConversation = await conversation.save();

                    return res
                        .status(STATUS_CODE.OK)
                        .json(
                            createResponse(
                                newConversation,
                                STATUS_MESSAGE.ENABLE_TRANSLATE_SUCCESSFULLY,
                                MESSAGE_CODE.ENABLE_TRANSLATE_SUCCESSFULLY,
                                STATUS_CODE.OK,
                                true,
                            ),
                        );
                } else {
                    return res
                        .status(STATUS_CODE.BAD_REQUEST)
                        .json(
                            createResponse(
                                null,
                                STATUS_MESSAGE.USER_HAS_NOT_ENABLED_TRANSLATE,
                                MESSAGE_CODE.USER_HAS_NOT_ENABLED_TRANSLATE,
                                STATUS_CODE.BAD_REQUEST,
                                false,
                            ),
                        );
                }
            }
        } catch (error) {
            next(error);
        }
    },
};
