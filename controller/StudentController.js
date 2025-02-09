const express = require("express");
const User = require("../model/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const { OAuth2Client } = require('google-auth-library');
dotEnv.config();
const secretKey = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const UserRegister = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const UserLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        console.log("userlogin:",user)
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign({ userId: user._id },secretKey,{ expiresIn: "1h" });
        res.status(200).json({ token, message: "Login successful" });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const googleAuth = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub, email, name } = payload;

        let user = await User.findOne({ email });
        if (!user) {
            // If user does not exist, create a new user
            user = new User({ username: name, email, password: sub }); // Use sub as a placeholder password
            await user.save();
        }

        // Generate JWT for the user
        const jwtToken = jwt.sign({ userId: user._id }, secretKey, { expiresIn: "1h" });
        res.status(200).json({ token: jwtToken, message: "Login successful" });
    } catch (error) {
        console.error("Error during Google authentication:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { UserRegister, UserLogin, googleAuth };
