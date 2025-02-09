const express = require("express");
const router = express.Router();
const { UserRegister, UserLogin, googleAuth } = require("../controller/StudentController");

router.post("/register", UserRegister);
router.post("/login", UserLogin);
router.post("/auth/google", googleAuth);

module.exports = router;