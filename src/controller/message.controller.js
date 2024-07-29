const mongodb = require('mongodb');
const { Translate } = require('@google-cloud/translate').v2;

const Conversation = require('../model/conversation.model');
const Message = require('@/model/message.model');
const User = require('@/model/user.model');
const Emoji = require('@/model/emoji.model');
const MESSAGE_CODE = require('@/enums/response/messageCode.enum');
const { createResponse } = require('@/utils/responseHelper');
const STATUS_MESSAGE = require('@/enums/response/statusMessage.enum');
const { STATUS_CODE } = require('@/enums/response');

const translate = new Translate({ key: process.env.TRANSLATION_API_KEY_TRANSLATION });

module.exports = {
    getAllMessages: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const conversation_id = req.params.id;
            const message = await Message.find({
                conversation: conversation_id,
                status: 'active',
                deleteBy: { $nin: userId },
            })
                .populate('sender', '_id fullName picture')
                .populate('conversation')
                .populate({
                    path: 'emojiBy',
                    populate: {
                        path: 'sender',
                        select: 'fullName _id status',
                    },
                });
            if (!message) {
                return res.status(200).json({
                    message: 'Get message was successfully',
                    messageCode: 'get_message_successfully',
                    data: [],
                });
            }
            return res.status(200).json({
                message: 'Get message was successfully',
                messageCode: 'get_message_successfully',
                data: message,
            });
        } catch (error) {
            next(error);
        }
    },
    getAllMessagePagination: async (req, res, next) => {
        if (res?.paginatedResults) {
            const { results, next, previous, currentPage, totalDocs, totalPages, lastPage } = res.paginatedResults;
            const responseObject = {
                totalDocs: totalDocs || 0,
                totalPages: totalPages || 0,
                lastPage: lastPage || 0,
                count: results?.length || 0,
                currentPage: currentPage || 0,
            };

            if (next) {
                responseObject.nextPage = next;
            }
            if (previous) {
                responseObject.prevPage = previous;
            }

            responseObject.Messages = results?.map((Messages) => {
                const { user, ...otherMessageInfo } = Messages._doc;
                return {
                    ...otherMessageInfo,
                    message: Messages._doc.status === 'recalled' ? 'Message has been recalled' : Messages._doc.message,
                    request: {
                        type: 'Get',
                        description: '',
                    },
                };
            });

            return res.status(200).send({
                success: true,
                error: false,
                message: 'Successful found message',
                status: 200,
                data: responseObject,
            });
        }
    },
    searchMessages: async (req, res, next) => {
        if (res?.paginatedResults) {
            const { results, totalDocs, totalPages, data } = res.paginatedResults;
            const responseObject = {
                totalDocs: totalDocs || 0,
                count: data.length || 0,
                data: data,
            };

            responseObject.Messages = results?.map((Messages) => {
                const { user, ...otherMessageInfo } = Messages._doc;
                return {
                    ...otherMessageInfo,
                    request: {
                        type: 'Get',
                        description: '',
                    },
                };
            });

            return res.status(200).send({
                success: true,
                error: false,
                message: 'Successful found message',
                status: 200,
                data: responseObject,
            });
        }
    },
    sendSingleMessage: async (req, res, next) => {
        const { message, messageType, isSpoiled, styles, emojiBy, replyMessage } = req.body;
        const userId = req.user._id;
        const conversationId = req.query.id;
        var messageCreated = {
            sender: req.user._id,
            message: message,
            conversation: conversationId,
            isSpoiled: isSpoiled,
            status: 'active',
            messageType: messageType,
            styles: styles,
            emojiBy: emojiBy,
            replyMessage: replyMessage,
            readBy: [userId],
        };
        try {
            const conversation = await Conversation.findOne({ _id: conversationId }).populate('latestMessage');
            if (!conversation) {
                return res
                    .status(404)
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
                            STATUS_MESSAGE.NO_PERMISSION_SEND_MESSAGE,
                            MESSAGE_CODE.NO_PERMISSION_SEND_MESSAGE,
                            false,
                        ),
                    );
            }

            const isUserBlocked = conversation.blockedUsers.some((item) => item.equals(userId));

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
            if (conversation?.blockedUsers?.length > 0) {
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
            var newMessage = await Message.create(messageCreated);
            await Conversation.findByIdAndUpdate(
                conversationId,
                {
                    latestMessage: newMessage._id,
                },
                { new: true },
            );
            newMessage = await newMessage.populate('sender', 'fullName picture email');
            newMessage = await newMessage.populate('conversation');
            newMessage = await newMessage.populate('replyMessage', '_id sender message messageType');
            newMessage = await Conversation.populate(newMessage, { path: 'conversation.latestMessage' });
            newMessage = await User.populate(newMessage, {
                path: 'conversation.users',
                select: 'fullName picture email',
            });

            return res
                .status(201)
                .json(
                    createResponse(
                        newMessage,
                        STATUS_MESSAGE.SEND_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.SEND_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.CREATED,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    sendMessage: async (data, socket) => {
        const userId = socket.user._id;
        const { message, messageType, isSpoiled, styles, emojiBy, conversationId, replyMessage } = data;
        var messageCreated = {
            sender: userId,
            message: message,
            conversation: conversationId,
            isSpoiled: isSpoiled,
            status: 'active',
            messageType: messageType,
            styles: styles,
            emojiBy: emojiBy,
            replyMessage: replyMessage,
        };
        try {
            const conversation = await Conversation.findOne({ _id: conversationId });
            if (!conversation) {
                return socket.emit(
                    'response send message',
                    createResponse(
                        null,
                        STATUS_MESSAGE.CONVERSATION_NOT_FOUND,
                        MESSAGE_CODE.CONVERSATION_NOT_FOUND,
                        false,
                    ),
                );
            }

            const isUserAlreadyExist = conversation.users.find((item) => item.equals(userId));
            if (!isUserAlreadyExist) {
                return socket.emit(
                    'response send message',
                    createResponse(
                        null,
                        STATUS_MESSAGE.USER_NOT_IN_GROUP,
                        MESSAGE_CODE.USER_NOT_IN_GROUP,
                        STATUS_CODE.FORBIDDEN,
                        false,
                    ),
                );
            }

            const isUserBlocked = conversation.blockedUsers.some((item) => item.equals(userId));
            if (isUserBlocked) {
                return socket.emit(
                    'response send message',
                    createResponse(
                        null,
                        STATUS_MESSAGE.USER_WAS_BLOCKED,
                        MESSAGE_CODE.USER_WAS_BLOCKED,
                        STATUS_CODE.FORBIDDEN,
                        false,
                    ),
                );
            }

            var newMessage = await Message.create(messageCreated);
            newMessage = await newMessage.populate('sender', 'fullName picture email');
            newMessage = await newMessage.populate('conversation');
            newMessage = await newMessage.populate('replyMessage', '_id sender message messageType');
            newMessage = await Conversation.populate(newMessage, { path: 'conversation.latestMessage' });
            newMessage = await User.populate(newMessage, {
                path: 'conversation.users',
                select: 'fullName picture email',
            });

            await Conversation.findByIdAndUpdate(
                conversationId,
                {
                    latestMessage: newMessage._id,
                },
                { new: true },
            );
            socket.in(conversationId).emit('message received', newMessage);
            return socket.emit(
                'response send message',
                createResponse(
                    newMessage,
                    STATUS_MESSAGE.SEND_MESSAGE_SUCCESSFULLY,
                    MESSAGE_CODE.SEND_MESSAGE_SUCCESSFULLY,
                    STATUS_CODE.CREATED,
                    true,
                ),
            );
        } catch (error) {
            return socket.emit(
                'response send message',
                createResponse(
                    error,
                    STATUS_MESSAGE.INTERNAL_SERVER_ERROR,
                    null,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    false,
                ),
            );
        }
    },
    deleteMessage: async (req, res, next) => {
        const messageId = req.query.id;
        const userId = req.user._id;
        try {
            const messageUpdate = await Message.findByIdAndUpdate(
                messageId,
                { $push: { deleteBy: userId } },
                { new: true, useFindAndModify: false },
            );
            if (!messageUpdate) {
                return res
                    .status(400)
                    .json(
                        createResponse(null, STATUS_MESSAGE.MESSAGE_NOT_FOUND, MESSAGE_CODE.MESSAGE_NOT_FOUND, false),
                    );
            }
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.DELETE_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.DELETE_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    editMessage: async (req, res, next) => {
        const messageId = req.query.id;
        const userId = req.user._id;
        const { content } = req.body;
        const message = await Message.findOne(messageId);
        if (!message) {
            return res.status(404).json({
                message: STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                messageCode: 'message_not_found',
                status: MESSAGE_CODE.MESSAGE_NOT_FOUND,
            });
        }
        try {
            if (String(message.sender) !== String(userId)) {
                return res.status(400).json({
                    message: STATUS_MESSAGE.NO_PERMISSION_EDIT_MESSAGE,
                    messageCode: 'no_permission_edit_message',
                    status: MESSAGE_CODE.NO_PERMISSION_RECALL_MESSAGE,
                    success: false,
                });
            }
            const createdAt = message.createdAt;
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            if (createdAt < thirtyMinutesAgo) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MESSAGE_TOO_OLD_TO_EDIT,
                            MESSAGE_CODE.MESSAGE_TOO_OLD_TO_EDIT,
                            STATUS_CODE.OK,
                            false,
                        ),
                    );
            }
            const messageUpdated = Message.findByIdAndUpdate(messageId, { message: content });
            if (!messageUpdated) {
                return res
                    .status(400)
                    .json(
                        createResponse(null, STATUS_MESSAGE.MESSAGE_NOT_FOUND, MESSAGE_CODE.MESSAGE_NOT_FOUND, false),
                    );
            }
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdated,
                        STATUS_MESSAGE.EDIT_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.EDIT_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    recallMessage: async (req, res, next) => {
        const messageId = req.query.id;
        const userId = req.user._id;
        try {
            const message = await Message.findOne({ _id: messageId });
            if (!message) {
                return res
                    .status(400)
                    .json(
                        createResponse(null, STATUS_MESSAGE.MESSAGE_NOT_FOUND, MESSAGE_CODE.MESSAGE_NOT_FOUND, false),
                    );
            }
            if (String(message.sender) !== String(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            message,
                            STATUS_MESSAGE.NO_PERMISSION_RECALL_MESSAGE,
                            MESSAGE_CODE.NO_PERMISSION_RECALL_MESSAGE,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }
            let messageUpdate = await Message.findByIdAndUpdate(
                { _id: messageId },
                { status: 'recalled' },
                { new: true },
            );
            if (messageUpdate.status === 'recalled') {
                messageUpdate.message = 'Message has been recalled';
            }
            return res
                .status(200)
                .json(
                    createResponse(
                        messageUpdate,
                        STATUS_MESSAGE.RECALL_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.RECALL_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    addEmojiMessage: async (req, res, next) => {
        const { emoji } = req.body;
        const messageId = req.query.id;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(messageId)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const addEmoji = await Emoji.create({
                sender: userId,
                emoji: emoji,
                status: 'active',
            });
            const addEmojiMessage = await Message.findByIdAndUpdate(
                messageId,
                {
                    $push: { emojiBy: addEmoji._id },
                },
                { new: true, useFindAndModify: false },
            ).populate({
                path: 'emojiBy',
                populate: {
                    path: 'sender',
                    select: 'fullName _id',
                },
            });
            return res.status(201).json({
                message: STATUS_MESSAGE.ADD_EMOJI_MESSAGE_SUCCESSFULLY,
                data: addEmojiMessage,
                conversation: addEmojiMessage.conversation,
                action: 'add',
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },
    updateEmojiMessage: async (req, res, next) => {
        const { newEmoji } = req.body;
        const { id } = req.query;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const emoji = await Emoji.findOne({ _id: id });
            if (!emoji) {
                return res.status(200).json({
                    message: 'Emoji has been remove',
                    status: 200,
                });
            }
            if (String(userId) !== String(emoji.sender)) {
                return res.status(409).json({
                    message: STATUS_MESSAGE.NOT_YOUR_EMOJI,
                    status: MESSAGE_CODE.NOT_YOUR_EMOJI,
                    success: false,
                });
            }
            const updateEmoji = await Emoji.findByIdAndUpdate(
                { _id: id },
                {
                    emoji: newEmoji,
                },
                { new: true, useFindAndModify: false },
            );
            return res.status(200).json({
                message: STATUS_MESSAGE.UPDATE_EMOJI_MESSAGE_SUCCESSFULLY,
                data: updateEmoji,
                action: 'edit',
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },
    removeEmojiMessage: async (req, res, next) => {
        const { emoji } = req.body;
        const { emojiId, messageId } = req.query;
        const userId = req.user._id;
        if (!mongodb.ObjectId.isValid(emojiId)) {
            return res.status(400).json({
                message: 'The id is invalid',
                messageCode: 'invalid_id',
            });
        }
        try {
            const emoji = await Emoji.findOne({ _id: emojiId });
            if (!emoji) {
                return res.status(400).json({
                    message: 'Emoji has been remove',
                    status: STATUS_CODE.BAD_REQUEST,
                    success: false,
                });
            }
            if (String(userId) !== String(emoji.sender)) {
                return res.status(409).json({
                    message: STATUS_MESSAGE.NOT_YOUR_EMOJI,
                    status: MESSAGE_CODE.NOT_YOUR_EMOJI,
                });
            }
            const updateMessage = await Message.findByIdAndUpdate(
                messageId,
                {
                    $pull: { emojiBy: emoji._id },
                },
                { new: true, useFindAndModify: false },
            );
            const updateEmoji = await Emoji.findOneAndDelete({ _id: emojiId });
            return res.status(200).json({
                message: STATUS_MESSAGE.REMOVE_EMOJI_MESSAGE_SUCCESSFULLY,
                data: updateEmoji,
                conversation: updateMessage.conversation,
                action: 'delete',
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },
    translateMessage: async (req, res, next) => {
        const userId = req.user._id;
        const { messageIds, languageCode } = req.body;

        try {
            const messages = await Message.find({ _id: { $in: messageIds } });

            if (!messages.length) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                            MESSAGE_CODE.MEMBER_NOT_FOUND,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const textsToTranslate = [];
            const indicesToTranslate = [];
            let characterCount = 0;

            // Kiểm tra xem tin nhắn đã được dịch chưa
            messages.forEach((msg, index) => {
                if (!msg.translations || (!msg.translations[languageCode] && msg.messageType === 'text')) {
                    characterCount += msg.message.length;
                    textsToTranslate.push(msg.message);
                    indicesToTranslate.push(index);
                }
            });

            if (textsToTranslate.length > 0) {
                const remainCharaterTranslate = await User.findById(userId).select('numberCharaterTranslate');

                if (characterCount > remainCharaterTranslate) {
                    return res
                        .status(STATUS_CODE.BAD_REQUEST)
                        .json(
                            createResponse(
                                null,
                                STATUS_MESSAGE.LIMIT_TRANSLATE,
                                MESSAGE_CODE.LIMIT_TRANSLATE,
                                STATUS_CODE.BAD_REQUEST,
                                false,
                            ),
                        );
                }

                const [translations] = await translate.translate(textsToTranslate, languageCode);

                // Cập nhật bản dịch vào MongoDB
                indicesToTranslate.forEach((index, i) => {
                    messages[index].translations[languageCode] = translations[i];
                });

                const bulkOps = messages.map((msg) => ({
                    updateOne: {
                        filter: { _id: msg._id },
                        update: { $set: { translations: msg.translations } },
                    },
                }));

                await Message.bulkWrite(bulkOps);
            }

            return res
                .status(STATUS_CODE.OK)
                .json(
                    createResponse(
                        messages,
                        STATUS_MESSAGE.TRANSLATE_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.TRANSLATE_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    readMessage: async (data, socket) => {
        try {
            const userId = socket.user._id;
            const isUserExist = await Message.findOne({ _id: data._id });
            if (isUserExist.readBy.includes(userId))
                return socket.emit('validation', createResponse(null, null, null, false));
            const messageUpdate = await Message.findByIdAndUpdate(
                { _id: data._id },
                { $push: { readBy: userId } },
                { new: true },
            );
            console.log('messageUpdate: ', messageUpdate);
            if (!messageUpdate) {
                return socket.emit(
                    'validation',
                    createResponse(
                        null,
                        STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                        MESSAGE_CODE.MESSAGE_NOT_FOUND,
                        STATUS_CODE.BAD_REQUEST,
                        false,
                    ),
                );
            }
            return socket.emit(
                'watched message',
                createResponse(
                    messageUpdate,
                    STATUS_MESSAGE.WATCH_MESSAGE_SUCCESSFULLY,
                    MESSAGE_CODE.WATCH_MESSAGE_SUCCESSFULLY,
                    STATUS_CODE.OK,
                    false,
                ),
            );
        } catch (error) {
            return socket.emit(
                'response message',
                createResponse(
                    error,
                    STATUS_MESSAGE.INTERNAL_SERVER_ERROR,
                    null,
                    STATUS_CODE.INTERNAL_SERVER_ERROR,
                    false,
                ),
            );
        }
    },
    getListImageMessage: async (req, res, next) => {
        const userId = req.user._id;
        const conversationId = req.params.id;
        try {
            const conversation = await Conversation.findOne({ _id: conversationId });
            if (!conversation?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_ACCESS_CONVERSATION,
                            MESSAGE_CODE.NO_PERMISSION_ACCESS_CONVERSATION,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            const message = await Message.find({
                conversation: conversationId,
                messageType: 'image',
                status: { $in: ['active'] },
                deleteBy: { $nin: userId },
            })
                .populate('sender', '_id fullName picture')
                .populate('affected_user_id', '_id fullName picture')
                .populate('conversation')
                .populate({
                    path: 'emojiBy',
                    populate: {
                        path: 'sender',
                        select: 'fullName _id',
                    },
                })
                .populate('replyMessage', '_id sender message messageType')
                .sort({ createdAt: -1 });
            if (!message) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                            MESSAGE_CODE.MESSAGE_NOT_FOUND,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            return res
                .status(200)
                .json(
                    createResponse(
                        message,
                        STATUS_MESSAGE.GET_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.GET_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    getListVideoMessage: async (req, res, next) => {
        const userId = req.user._id;
        const conversationId = req.params.id;
        try {
            const conversation = await Conversation.findOne({ _id: conversationId });
            if (!conversation?.users?.includes(userId)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.NO_PERMISSION_ACCESS_CONVERSATION,
                            MESSAGE_CODE.NO_PERMISSION_ACCESS_CONVERSATION,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }
            const message = await Message.find({
                conversation: conversationId,
                messageType: 'video',
                status: { $in: ['active'] },
                deleteBy: { $nin: userId },
            }).sort({ createdAt: -1 });
            if (!message) {
                return res
                    .status(STATUS_CODE.BAD_REQUEST)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.MESSAGE_NOT_FOUND,
                            MESSAGE_CODE.MESSAGE_NOT_FOUND,
                            STATUS_CODE.BAD_REQUEST,
                            false,
                        ),
                    );
            }

            return res
                .status(200)
                .json(
                    createResponse(
                        message,
                        STATUS_MESSAGE.GET_MESSAGE_SUCCESSFULLY,
                        MESSAGE_CODE.GET_MESSAGE_SUCCESSFULLY,
                        STATUS_CODE.OK,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
};
