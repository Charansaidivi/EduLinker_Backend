const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String, default: null },
  ratings: { type: Number, default: 0 },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  teachingSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  enrolledSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
}, { timestamps: true });

module.exports = mongoose.model("Student", userSchema);
