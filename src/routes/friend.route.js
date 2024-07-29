const router = require('express').Router();

const validations = require('@/validations');
const FriendController = require('../controller/friend.controller');
const verifyToken = require('../middlewares/verifyToken.middleware');
const { validateParams, validateQuery } = require('@/middlewares/validator.middleware');

router.get('/', verifyToken, FriendController.getFriendList);

// router.put('/', verifyToken, FriendController.updateFriendRequest);

router.post(
    '/addFriendRequest',
    verifyToken,
    validateQuery(validations.validateIdMongodb),
    FriendController.createAddFriendRequest,
);

router.get('/addFriendRequest', verifyToken, FriendController.getAddFriendRequest);

router.get('/addFriendRequestNotification', verifyToken, FriendController.getAddFriendRequestNotification);

router.put(
    '/acceptFriendRequest',
    validateQuery(validations.validateIdMongodb),
    verifyToken,
    FriendController.acceptFriendRequest,
);

router.patch(
    '/rejectFriendRequest',
    validateQuery(validations.validateIdMongodb),
    verifyToken,
    FriendController.rejectFriendRequest,
);

router.get('/friendRequestHasBeenSent', verifyToken, FriendController.getAddFriendRequestHasBeenSent);

router.delete('/friendRequestHasBeenSent', verifyToken, FriendController.removeFriendRequest);

router.delete(
    '/deleteFriend',
    // validateQuery(validations.validateIdMongodb),
    verifyToken,
    FriendController.removeFriend,
);

module.exports = router;
