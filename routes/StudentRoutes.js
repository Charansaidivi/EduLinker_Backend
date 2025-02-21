const express = require('express');
const { UserRegister, UserLogin, googleAuth, getProfile, getSessionDetails, uploadProfileImage, upload, requestPasswordReset, resetPassword } = require('../controller/StudentController');
const { verify } = require('jsonwebtoken');
const router = express.Router();

router.post('/register', UserRegister);
router.post('/login', UserLogin);
router.post('/google-auth', googleAuth);
router.get('/profile/:userId', getProfile);
router.post('/upload/:userId', upload.single('media'), uploadProfileImage); // New route for image upload
router.post('/sessions/details', getSessionDetails); // New route for teaching sessions
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;