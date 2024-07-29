const express = require('express');
const http = require('http'); // cần một máy chủ HTTP để Socket.IO có thể làm việc đúng cách
const mongodb = require('mongodb');
const moment = require('moment');
const Conversation = require('@/model/conversation.model');
const User = require('@/model/user.model');
const FriendRequest = require('@/model/friendRequest.model');
const {
    createGroupChat,
    addMemberGroupChat,
    deleteMemberGroupChat,
    updateGroupChat,
    deleteGroupChat,
    exchangeGroupAdmin,
} = require('@/controller/group_chat.controller');
const { sendMessage, readMessage } = require('@/controller/message.controller');

const { eventValidators } = require('@/validations');
const verifyTokenSocketMiddleware = require('@/middlewares/verifyTokenSocket.middleware');

const { createResponse } = require('@/utils/responseHelper');
const { MESSAGE_CODE, STATUS_CODE } = require('@/enums/response');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: [
            process.env.URL_CLIENT,
            process.env.URL_CLIENT_LOCAL,
            process.env.URL_CLIENT_TEST,
            process.env.URL_CLIENT_DEPLOY,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
        // credentials: true,
    },
});

io.on('connection', async (socket) => {
    // verify user
    const token = socket.handshake.headers['authorization'];
    const error = verifyTokenSocketMiddleware(token, socket);

    if (error) return;

    socket.use((packet, next) => {
        const [event, data] = packet;

        // validate event
        if (eventValidators[event]) {
            const { error } = eventValidators[event].validate(data, { context: { user: socket.user } });
            if (error) {
                socket.emit(
                    'validation',
                    createResponse({ event, ...error }, error.details[0], null, STATUS_CODE.BAD_REQUEST, false),
                );
                return;
            }
        }
        next();
    });

    //Set up id user to sent message
    socket.on('setup', (userData) => {
        if (socket?.user?._id) {
            socket.join(String(socket?.user?._id));
        } else socket.join(userData?._id);
        // socket.join(userData?._id);
        socket.emit('connected');
    });

    //Send request add friend
    socket.on('friend request', (newRequest) => {
        try {
            const receiverId = newRequest.receiver._id;
            console.log('vo request ');

            console.log('receiverId: ', receiverId);
            socket.to(receiverId).emit('received request', newRequest);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Accept request friend
    socket.on('accept request', (newRequest) => {
        const senderId = newRequest.sender._id;
        socket.to(senderId).emit('received reply', newRequest);
    });

    //Group chat
    socket.on('create group', (data) => {
        createGroupChat(data, socket);
    });
    socket.on('add member', (data) => {
        addMemberGroupChat(data, socket);
    });
    socket.on('delete member', (data) => {
        deleteMemberGroupChat(data, socket);
    });
    socket.on('exchange admin group', (data) => {
        exchangeGroupAdmin(data, socket);
    });
    socket.on('update group', (data) => {
        updateGroupChat(data, socket);
    });
    socket.on('delete group', (data) => {
        deleteGroupChat(data, socket);
    });

    socket.on('send message', (data) => {
        sendMessage(data, socket);
    });

    //Check is read friend request
    socket.on('read request', async (newRequest) => {
        try {
            const newRequestId = newRequest._id;
            const sender = newRequest.sender._id;
            const updateRequest = await FriendRequest.findByIdAndUpdate(newRequestId, { isRead: true });
            socket.to(sender).emit('isRead', true);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('login', async (userId) => {
        try {
            if (!mongodb.ObjectId.isValid(userId)) {
                return socket.emit(
                    'validation',
                    createResponse(
                        null,
                        STATUS_MESSAGE.ACCOUNT_INACTIVE,
                        MESSAGE_CODE.ACCOUNT_INACTIVE,
                        STATUS_CODE.FORBIDDEN,
                        false,
                    ),
                );
            }
            const user = await User.findById(userId).select('socketId');

            const isDuplicate = user.socketId.some((item) => item === socket.id);
            if (isDuplicate) {
                console.log('The socket id duplicate');
            } else {
                user.socketId.push = socket.id;
                is_online = true;
                await user.save();
            }
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('logout', async (userId) => {
        try {
            const user = await User.findById(userId).select('socketId');
            if (user) {
                user.socketId = user.socketId.filter((item) => item !== socket.id);

                if (user.socketId.length) {
                    user.offline_at = moment();
                    user.is_online = false;
                }

                await user.save();
                console.log('The user was logout');
            } else {
                console.log('The user not found');
            }
        } catch (error) {
            console.log(error);
        }
    });

    //Create new conversation
    socket.on('access chat', async (conversationInfo) => {
        try {
            if (conversationInfo?.conversation) {
                for (i = 0; i < conversationInfo?.conversation?.users.length; i++) {
                    const userId = conversationInfo?.conversation?.users[i]._id;
                    if (userId !== conversationInfo?.userId) {
                        if (
                            conversationInfo?.conversation?.deleteBy.includes(userId) &&
                            !conversationInfo?.conversation?.blockedUsers?.includes(userId)
                        ) {
                            const conversationUpdate = await Conversation.findByIdAndUpdate(
                                { _id: conversationInfo?.conversation?._id },
                                { $pull: { deleteBy: conversationInfo?.conversation?.users[i]._id } },
                                { new: true },
                            );
                            socket
                                .to(conversationInfo?.conversation?.users[i]._id)
                                .emit('accessed chat', conversationInfo);
                        }
                    }
                }
            }
        } catch (error) {
            console.log('error: ', error);
        }
    });

    //Set up room with conversation id for user who was join to chat
    socket.on('join chat', (room) => {
        console.log('join chat: ', room);

        socket.join(room);
    });

    //Out room chat with conversation id when user leave chat or not focus on chat room
    socket.on('leave chat', (room) => {
        try {
            if (room) {
                console.log('leave room: ', room);
                socket.leave(room);
            } else {
                console.log('room not found');
            }
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Listening the action type of user when they are typing
    socket.on('typing', (room) => {
        socket.in(room).emit('typing');
    });

    //Listening the action stop type of user when they was stopped typing
    socket.on('stop_typing', (room) => socket.in(room).emit('stop_typing'));

    //Listening the action read message of user when they was seen the message
    socket.on('watch message', (message) => {
        try {
            readMessage(message, socket);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Listening the action reacting message with emoji
    socket.on('add emoji', (emojiAdded) => {
        try {
            if (!emojiAdded.conversation) {
                console.log('Invalid conversation id');
                return;
            }
            const chatRoom = emojiAdded.conversation;

            socket.to(chatRoom).emit('emoji received', emojiAdded);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Listening the action edit emoji
    socket.on('edit emoji', (emojiAdded) => {
        try {
            if (!emojiAdded.conversation) {
                console.log('Invalid conversation id');
                return;
            }
            const chatRoom = emojiAdded.conversation;

            socket.to(chatRoom).emit('emoji received', emojiAdded);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Listening the action delete emoji
    socket.on('delete emoji', (emojiAdded) => {
        try {
            if (!emojiAdded.conversation) {
                console.log('Invalid conversation id');
                return;
            }
            const chatRoom = emojiAdded.conversation;

            socket.to(chatRoom).emit('emoji received', emojiAdded);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    // Gửi thông báo tin nhắn đã bị thu hồi đến tất cả socket trong phòng, ngoại trừ socket của người gửi
    socket.on('recall', (messageRecalled) => {
        try {
            if (!messageRecalled || !messageRecalled.data.data.conversation) {
                console.error('Invalid newMessageReceived data');
                return;
            }
            const chatRoom = messageRecalled.data.data.conversation;
            socket.to(chatRoom).emit('recall received', messageRecalled);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    // Gửi tin nhắn đến tất cả socket trong phòng, ngoại trừ socket của người gửi
    socket.on('new message', async (newMessageReceived) => {
        try {
            if (!newMessageReceived || !newMessageReceived.conversation || !newMessageReceived.conversation._id) {
                console.error('Invalid newMessageReceived data');
                return;
            }

            const chatRoom = newMessageReceived.conversation._id;

            socket.to(chatRoom).emit('message received', newMessageReceived);

            const users = await Conversation.findOne({ _id: chatRoom });

            if (users) {
                for (i = 0; i < users.users.length; i++) {
                    socket.to(String(users.users[i])).emit('new message received', newMessageReceived);
                }
            }
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    //Change background conversation
    socket.on('change background', async (background) => {
        try {
            console.log('background: ', background);
            const conversation = background._id;
            socket.in(conversation).emit('changed background', background);
        } catch (error) {
            console.log('error socket: ', error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            const user = await User.findOne({ socketId: socket.id }).select('socketId _id');

            if (user) {
                user.socketId = user.socketId.filter((item) => item !== socket.id);

                if (!user.socketId.length) {
                    user.offline_at = moment();
                    user.is_online = false;
                }
                await user.save();
            }
            console.log(socket.id + ' disconnect');
        } catch (error) {
            console.log(error);
        }
    });
});

module.exports = { app, io, server };
