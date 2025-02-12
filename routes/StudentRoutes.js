const express = require('express');
const { UserRegister, UserLogin, googleAuth, getProfile, uploadProfileImage, upload } = require('../controller/StudentController');
const router = express.Router();

router.post('/register', UserRegister);
router.post('/login', UserLogin);
router.post('/google-auth', googleAuth);
router.get('/profile/:userId', getProfile);
router.post('/upload/:userId', upload.single('media'), uploadProfileImage); // New route for image upload

module.exports = router;