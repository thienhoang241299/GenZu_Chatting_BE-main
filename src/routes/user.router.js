const router = require('express').Router();

const User = require('../controller/user.controller');
const verifyToken = require('../middlewares/verifyToken.middleware');
const { validateBody, validateQuery } = require('@/middlewares/validator.middleware');
const { updateProfileBody, blockUser, validateIdMongodb } = require('@/validations');

router.patch('/update/:id', verifyToken, validateBody(updateProfileBody), User.updateProfile);
router.get('/sidebar', verifyToken, User.getUserForSidebar);
router.get('/searchUsers', verifyToken, User.getUserByKeyWord);
router.get('/getUserById', verifyToken, User.getUserById);
router.get('/blockUsers', verifyToken, User.getBlockUser);
router.patch('/blockUsers', verifyToken, validateQuery(blockUser), User.blockUser);
router.patch('/unBlockUsers', verifyToken, validateQuery(blockUser), User.unBlockUser);

module.exports = router;
