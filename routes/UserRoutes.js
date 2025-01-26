const express = require("express");
const router = express.Router();
const UserController = require("../controller/UserController");

router.post("/register", UserController.UserRegister);
router.post("/login", UserController.UserLogin);

module.exports = router;