const express = require('express');
const router = express.Router();
const { createSession, getSessions,enrollStudent } = require('../controller/SessionController');
const verifyToken = require('../middleware/verifyToken')

router.post('/create-session',verifyToken,createSession);
router.get('/sessions', getSessions);
router.post('/enroll/:sessionId',verifyToken,enrollStudent);
module.exports = router;