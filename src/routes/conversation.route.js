const router = require('express').Router();
const upload = require('multer')();

const ConversationController = require('../controller/conversation.controller');
const GroupChatController = require('@/controller/group_chat.controller');
const verifyToken = require('../middlewares/verifyToken.middleware');
const { validateBody, validateParams, validateQuery } = require('@/middlewares/validator.middleware');
const {
    createGroupBody,
    updateGroupBody,
    validateIdMongodb,
    addMemberGroupBody,
    deleteMemberGroupBody,
    updateBackgroundConversation,
    updateAvatarConversation,
    blockUserConversation,
    autoTranslateConversation,
} = require('@/validations');

router.get('/:id', verifyToken, validateParams(validateIdMongodb), ConversationController.getConversationById);
router.get('/', verifyToken, ConversationController.fetchConversation);
router.post('/', verifyToken, ConversationController.accessConversation);
router.patch('/', verifyToken, validateQuery(validateIdMongodb), ConversationController.redoHistoryConversation);
router.delete('/', verifyToken, validateQuery(validateIdMongodb), ConversationController.removeHistoryConversation);

router.patch(
    '/background',
    verifyToken,
    validateQuery(validateIdMongodb),
    validateBody(updateBackgroundConversation),
    ConversationController.updateConversationBackground,
);
router.patch(
    '/avatar',
    verifyToken,
    validateQuery(validateIdMongodb),
    validateBody(updateAvatarConversation),
    ConversationController.updateConversationAvatar,
);

router.post('/group', verifyToken, validateBody(createGroupBody), GroupChatController.createGroupChat);
router.patch(
    '/add-member/group/:id',
    verifyToken,
    validateParams(validateIdMongodb),
    validateBody(addMemberGroupBody),
    GroupChatController.addMemberGroupChat,
);
router.patch(
    '/delete-member/group/:id',
    verifyToken,
    validateParams(validateIdMongodb),
    validateBody(deleteMemberGroupBody),
    GroupChatController.deleteMemberGroupChat,
);
router.delete('/group/:id', verifyToken, validateParams(validateIdMongodb), GroupChatController.deleteGroupChat);

router.patch(
    '/group/:id',
    verifyToken,
    validateParams(validateIdMongodb),
    validateBody(updateGroupBody),
    GroupChatController.updateGroupChat,
);
router.patch(
    '/blockUsers',
    verifyToken,
    validateQuery(blockUserConversation),
    ConversationController.blockUserConversation,
);
router.patch(
    '/unBlockUsers',
    verifyToken,
    validateQuery(blockUserConversation),
    ConversationController.unBlockUserConversation,
);
router.patch(
    '/autoTranslate/:id',
    verifyToken,
    upload.single(),
    validateBody(autoTranslateConversation),
    validateParams(validateIdMongodb),
    ConversationController.autoTranslate,
);

module.exports = router;
