const router = require('express').Router();

const paymentController = require('@/controller/payment.controller');
const { validateBody } = require('@/middlewares/validator.middleware');
const verifyTokenMiddleware = require('@/middlewares/verifyToken.middleware');
const { upgradeAccount } = require('@/validations/payment.validation');

router.post('/upgrade_account', verifyTokenMiddleware, validateBody(upgradeAccount), paymentController.payment);
router.post('/notify', verifyTokenMiddleware, paymentController.notify);

module.exports = router;
