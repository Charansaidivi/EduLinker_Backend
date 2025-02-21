const express = require("express");
const User = require("../model/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotEnv = require("dotenv");
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Session = require("../model/Session");
dotEnv.config();
const secretKey = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

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
const getProfile = async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    res.status(200).json(user);
};

// New function to handle image upload
const uploadProfileImage = async (req, res) => {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (req.file) {
        // Check if there is an existing profile image
        if (user.profileImage) {
            const oldImagePath = path.join(__dirname, '../uploads', user.profileImage); // Construct the path to the old image
            fs.unlink(oldImagePath, (err) => { // Delete the old image file
                if (err) {
                    console.error("Error deleting old image:", err);
                }
            });
        }
        user.profileImage = req.file.filename; // Update the profile image field
        await user.save();
        return res.status(200).json({ profileImage: user.profileImage });
    } else {
        return res.status(400).json({ message: "No file uploaded" });
    }
};
const handleBookSlot=()=>{
    console.log(req.userId);
}

// Add this function to handle fetching session details
const getSessionDetails = async (req, res) => {
    const { sessionIds } = req.body; // Get session IDs from the request body
    try {
        const sessions = await Session.find({ _id: { $in: sessionIds } }); // Assuming you have a Session model
        res.status(200).json(sessions); // Send the session details back
    } catch (error) {
        console.error("Error fetching session details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a random token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(resetToken, 10);

        // Save token and expiration to user document
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
        await user.save();

        // Send email with reset token
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.Email,
                pass: process.env.Password
            }
        });

        const mailOptions = {
            from: process.env.Email,
            to: user.email,
            subject: 'Password Reset Request',
            text: `You are receiving this email because you requested a password reset.\n\n
                  Please click on the following link to reset your password (valid for 1 hour):\n\n
                  http://localhost:5173/reset-password/${resetToken}/${encodeURIComponent(email)}\n\n
                  If you did not request this, please ignore this email.\n`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: "Error sending email" });
            }
            console.log('Email sent: ' + info.response);
            return res.status(200).json({ message: "Password reset email sent" });
        });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const resetPassword = async (req, res) => {
    const { token, newPassword, email } = req.body;
    try {
        // Find user by email and check if reset token exists and is valid
        const user = await User.findOne({
            email: email,
            resetPasswordToken: { $exists: true },
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Verify token
        const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
        if (!isTokenValid) {
            return res.status(400).json({ message: "Invalid reset token" });
        }

        // Update password and clear reset token fields
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { 
    UserRegister,
    UserLogin,
    handleBookSlot,  
    googleAuth, 
    getProfile,
    getSessionDetails,
    uploadProfileImage,
    upload,
    requestPasswordReset, // Export the new function
    resetPassword // Export the new function
};
