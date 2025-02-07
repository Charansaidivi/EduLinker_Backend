const express = require('express');
const router = express.Router();
const { createSession } = require('../controller/SessionController');
const verifyToken = require('../middleware/verifyToken')

router.post('/create-session',verifyToken,createSession);

module.exports = router;