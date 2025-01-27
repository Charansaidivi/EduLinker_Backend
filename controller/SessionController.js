const Session = require('../model/Session');
const Student = require('../model/Student');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });

const createSession = async (req, res) => {
    try {
        const {
            topicName,
            description,
            startDate,
            endDate,
            startTime,
            endTime,
            maxSlots,
            meetingLink
        } = req.body;

        const media = req.file ? req.file.filename : undefined;

        // Fetch the student by ID
        const student = await Student.findById(req.studentId);
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        // Create a new session document
        const session = new Session({
            studentId: student._id,
            topicName,
            description,
            startDate,
            endDate,
            startTime,
            endTime,
            maxSlots,
            availableSlots: maxSlots, // Initially, available slots equals max slots
            meetingLink,
            media
        });

        // Save the session document
        const savedSession = await session.save();
        const sessionId = savedSession._id;

        return res.status(201).json({
            msg: "Session created successfully",
            sessionId,
            topicName
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Internal server error" });
    }
};

module.exports = { 
    createSession: [upload.single('media'), createSession]
};