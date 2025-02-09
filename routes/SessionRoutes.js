const express = require('express');
const router = express.Router();
const { createSession, getSessions } = require('../controller/SessionController');
const verifyToken = require('../middleware/verifyToken')

router.post('/create-session',verifyToken,createSession);
router.get('/sessions', getSessions);

module.exports = router;