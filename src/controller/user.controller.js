const mongodb = require('mongodb');

const User = require('../model/user.model');

const FriendShip = require('../model/friendShip.model');

const Conversation = require('../model/conversation.model');
const { STATUS_MESSAGE, MESSAGE_CODE } = require('@/enums/response');
const { createResponse } = require('@/utils/responseHelper');

module.exports = {
    updateProfile: async (req, res, next) => {
        try {
            const user = await User.findByIdAndUpdate({ _id: req.user._id }, req.body, {
                new: true,
            }).select('-password');

            if (!user) {
                return res.status(404).json({
                    message: 'The user not found',
                    messageCode: 'user_not_found',
                    status: 404,
                    success: false,
                });
            }

            res.status(200).json({
                message: 'Get user for sidebar successfully',
                messageCode: 'get_user_successfully',
                user,
                status: 200,
                success: true,
            });
        } catch (error) {
            next(error);
        }
    },
    getUserForSidebar: async (req, res, next) => {
        try {
            const id = req.user._id;
            const users = await User.find({ _id: { $ne: id } }).select('-password');

            res.status(200).json({
                message: 'Get user for sidebar successfully',
                messageCode: 'get_user_successfully',
                users,
            });
        } catch (error) {
            next(error);
        }
    },
    getUserByKeyWord: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const keyword = req.query.search
                ? {
                      $or: [
                          { fullName: { $regex: req.query.search, $options: 'i' } },
                          { email: { $regex: req.query.search, $options: 'i' } },
                      ],
                  }
                : {};
            const userInfo = await User.findOne({ _id: userId });
            const userList = await User.find(keyword)
                .find({ _id: { $ne: userId } })
                .select('fullName picture email gender blockedUsers');

            const user = userList.filter(
                (user) => !user.blockedUsers?.includes(userId) && !userInfo.blockedUsers?.includes(user._id),
            );
            res.status(200).json({
                message: 'Search user successfully',
                messageCode: 'search_user_successfully',
                user,
            });
        } catch (error) {
            next(error);
        }
    },
    getUserById: async (req, res, next) => {
        try {
            const userId = req.user._id;
            const id = req.query.userId;
            if (!mongodb.ObjectId.isValid(id)) {
                return res.status(400).json({
                    message: 'The user id is invalid',
                    messageCode: 'invalid_userId',
                });
            }
            const user = await User.findOne({ _id: userId }, 'fullName email picture blockedUsers');

            const userBlock = await User.findOne({ _id: id }, 'fullName email picture blockedUsers');
            if (!userBlock || !user) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, true));
            }
            if (user?.blockedUsers?.includes(id)) {
                return res
                    .status(400)
                    .json(
                        createResponse(
                            null,
                            STATUS_MESSAGE.CONVERSATION_WAS_BLOCKED,
                            MESSAGE_CODE.CONVERSATION_WAS_BLOCKED,
                            true,
                        ),
                    );
            }
            //Check block user
            if (userBlock?.blockedUsers?.includes(userId)) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_WAS_BLOCKED, MESSAGE_CODE.USER_WAS_BLOCKED, true));
            }
            const relationShip = await FriendShip.findOne({
                users: { $all: [id, req.user._id] },
                status: 'active',
            });
            const conversation = await Conversation.find({
                $and: [{ users: { $elemMatch: { $eq: id } } }, { users: { $elemMatch: { $eq: userId } } }],
            })
                .populate('users', '_id fullName email picture')
                .populate('latestMessage');

            return res.status(200).json({
                message: 'Search user successfully',
                messageCode: 'search_user_successfully',
                user,
                conversation: conversation,
                relationShip: relationShip ? relationShip : 'Not a friend yet',
            });
        } catch (error) {
            next(error);
        }
    },
    getBlockUser: async (req, res, next) => {
        const userId = req.user._id;
        try {
            const blockListUser = await User.findOne({ _id: userId })
                .select('blockedUsers')
                .populate('blockedUsers', 'fullName picture email');
            if (!blockListUser) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
            }
            const blockedUsers = blockListUser.blockedUsers;

            if (blockedUsers.length === 0) {
                return res
                    .status(200)
                    .json(
                        createResponse(
                            [],
                            STATUS_MESSAGE.GET_BLOCK_USER_SUCCESSFULLY,
                            MESSAGE_CODE.GET_BLOCK_USER_SUCCESSFULLY,
                            true,
                        ),
                    );
            }
            const blockList = blockListUser?.blockedUsers?.map((list) => {
                return {
                    _id: list._id,
                    fullName: list.fullName,
                    picture: list.picture,
                    email: list.email,
                    status: list.status,
                    is_online: list.is_online,
                };
            });
            return res
                .status(200)
                .json(
                    createResponse(
                        blockList,
                        STATUS_MESSAGE.GET_BLOCK_USER_SUCCESSFULLY,
                        MESSAGE_CODE.GET_BLOCK_USER_SUCCESSFULLY,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    blockUser: async (req, res, next) => {
        const userId = req.user._id;
        const userBlockId = req.query.blockUserId;
        try {
            const userBlocked = await User.findById({ _id: userBlockId });
            const user = await User.findById({ _id: userId });
            if (!userBlocked || !user) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
            }
            if (user?.blockedUsers?.includes(userBlockId)) {
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

            const userUpdate = await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $push: { blockedUsers: [userBlockId] },
                },
                {
                    new: true,
                },
            )
                .select('fullName email picture blockedUsers')
                .populate('blockedUsers', 'fullName email picture ');
            var conversation = await Conversation.findOne({
                isGroupChat: false,
                $and: [
                    { users: { $elemMatch: { $eq: req.user._id } } },
                    { users: { $elemMatch: { $eq: userBlockId } } },
                ],
            })
                .populate('users', '-password')
                .populate('latestMessage');
            if (conversation) {
                const blockConversation = await Conversation.findByIdAndUpdate(
                    { _id: conversation._id },
                    {
                        $push: { blockedUsers: [userBlockId] },
                    },
                    { new: true },
                );
            }
            return res
                .status(200)
                .json(
                    createResponse(
                        userUpdate,
                        STATUS_MESSAGE.BLOCK_USER_SUCCESSFULLY,
                        MESSAGE_CODE.BLOCK_USER_SUCCESSFULLY,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
    unBlockUser: async (req, res, next) => {
        const userId = req.user._id;
        const userBlockId = req.query.blockUserId;
        try {
            const userBlocked = await User.findById({ _id: userBlockId });
            if (!userBlocked) {
                return res
                    .status(400)
                    .json(createResponse(null, STATUS_MESSAGE.USER_NOT_FOUND, MESSAGE_CODE.USER_NOT_FOUND, false));
            }

            const userUpdate = await User.findByIdAndUpdate(
                { _id: userId },
                {
                    $pull: { blockedUsers: userBlockId },
                },
                {
                    new: true,
                },
            )
                .select('fullName email picture blockedUsers')
                .populate('blockedUsers', 'fullName email picture ');
            var conversation = await Conversation.findOne({
                isGroupChat: false,
                $and: [
                    { users: { $elemMatch: { $eq: req.user._id } } },
                    { users: { $elemMatch: { $eq: userBlockId } } },
                ],
            })
                .populate('users', '-password')
                .populate('latestMessage');
            if (conversation) {
                await Conversation.findByIdAndUpdate(
                    { _id: conversation._id },
                    {
                        $pull: { blockedUsers: userBlockId },
                    },
                );
            }
            return res
                .status(200)
                .json(
                    createResponse(
                        userUpdate,
                        STATUS_MESSAGE.UN_BLOCK_USER_SUCCESSFULLY,
                        MESSAGE_CODE.UN_BLOCK_USER_SUCCESSFULLY,
                        true,
                    ),
                );
        } catch (error) {
            next(error);
        }
    },
};
