const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // Reference to the teacher
  topicName: { 
    type: String, 
    required: true 
  }, // Name of the class or topic
  description: { 
    type: String, 
    default: "" 
  }, // Description or context of the session
  startDate: { 
    type: Date, 
    required: true 
  }, // Start date of the class
  endDate: { 
    type: Date, 
    required: true 
  }, // End date of the class
  startTime: { 
    type: String, 
    required: true 
  }, // Starting time (e.g., "10:00 AM")
  endTime: { 
    type: String, 
    required: true 
  }, // Ending time (e.g., "11:30 AM")
  maxSlots: { 
    type: Number, 
    required: true 
  }, // Maximum number of learners
  availableSlots: { 
    type: Number, 
    required: true 
  }, // Remaining slots
  meetingLink: { 
    type: String, 
    required: true 
  }, // Link for the online class (e.g., Google Meet/Zoom)
  media: { 
    type: [String], 
    default: [] 
  }, // Array of URLs for images or videos that describe the class
}, { timestamps: true });

module.exports = mongoose.model("Session", sessionSchema);
