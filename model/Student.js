const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },// Topics the user is interested in (for learners) or teaches (for teachers)
  profileImage: { type: String, default: null }, // URL of the profile image
  ratings: { type: Number, default: 0 }, // Teacher's rating; learners won't need this
}, { timestamps: true });

module.exports = mongoose.model("Student", userSchema);
