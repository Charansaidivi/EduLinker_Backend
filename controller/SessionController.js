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
            meetingLink,
            topicType
        } = req.body;

        const media = req.file ? req.file.filename : undefined;
        // Fetch the student by ID
        const student = await Student.findById(req.userId);
        console.log(student)
        if (!student) {
            return res.status(404).json({ msg: "Student not found" });
        }

        // Create a new session document
        const session = new Session({
            studentId: student._id,
            topicName,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime,
            endTime,
            maxSlots: Number(maxSlots),
            availableSlots: Number(maxSlots), // Initially, available slots equals max slots
            meetingLink,
            media,
            topicType
        });

        // Save the session document
        const savedSession = await session.save();
        const sessionId = savedSession._id;

        // Update the student's teachingSessions field
        student.teachingSessions.push(sessionId);
        await student.save();

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

const getSessions = async (req, res) => {
    try {
        const { searchTerm, topicType } = req.query;
        const query = {};

        if (searchTerm) {
            query.topicName = { $regex: searchTerm, $options: 'i' }; // Case-insensitive search
        }

        if (topicType) {
            query.topicType = topicType;
        }

        const sessions = await Session.find(query).populate('studentId', 'username profileImage');
        
        const sessionsWithProfileImage = sessions.map(session => {
            const { studentId, ...rest } = session.toObject();
            return {
                ...rest,
                student: {
                    username: studentId.username,
                    ...(studentId.profileImage && { profileImage: studentId.profileImage })
                }
            };
        });

        res.status(200).json(sessionsWithProfileImage);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
};

module.exports = { 
    createSession: [upload.single('media'), createSession],
    getSessions
};