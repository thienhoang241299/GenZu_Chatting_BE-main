const express = require('express');

const GeneralController = require('../controller/general.controller');

const router = express.Router();

router.get('/', GeneralController.home);
router.get('*', GeneralController.notFound);

module.exports = router;
