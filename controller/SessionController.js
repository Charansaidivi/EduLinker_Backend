const Session = require('../model/Session');
const Student = require('../model/Student');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

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
        let query = {};

        if (searchTerm) {
            query.$or = [
                { topicName: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { topicType: { $regex: searchTerm, $options: 'i' } },
                // Add lookup for instructor's username
                {
                    $expr: {
                        $regexMatch: {
                            input: { $toString: "$studentId.username" },
                            regex: searchTerm,
                            options: "i"
                        }
                    }
                }
            ];
        }

        if (topicType && topicType !== '') {
            query.topicType = topicType;
        }

        // Add filters for valid sessions
        const currentDate = new Date();
        query.endDate = { $gte: currentDate };
        query.availableSlots = { $gt: 0 };

        const sessions = await Session.find(query)
            .populate({
                path: 'studentId',
                select: 'username profileImage'
            })
            .sort({ startDate: 1 })
            .lean();

        const sessionsWithProfileImage = sessions.map(session => ({
            ...session,
            student: {
                username: session.studentId.username,
                profileImage: session.studentId.profileImage || null
            },
            studentId: undefined
        }));

        res.status(200).json(sessionsWithProfileImage);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ 
            msg: 'Internal server error', 
            error: error.message 
        });
    }
};

const enrollStudent = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        const studentId = req.userId; // Assuming you have middleware to set req.userId
        console.log(studentId)

        // Find the session
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ msg: "Session not found" });
        }

        // Check if the student is already enrolled
        if (session.enrolledStudents.includes(studentId)) {
            return res.status(400).json({ msg: "You are already enrolled in this session" });
        }

        // Check if there are available slots
        if (session.availableSlots <= 0) {
            return res.status(400).json({ msg: "No available slots" });
        }

        // Enroll the student
        session.enrolledStudents.push(studentId);
        session.availableSlots -= 1; // Decrease available slots
        await session.save();

        // Update the student's enrolledSessions field
        const student = await Student.findById(studentId);
        student.enrolledSessions.push(sessionId);
        await student.save();

        // Send email to the student
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Use your email service provider
            auth: {
                user: process.env.Email, // Your email
                pass: process.env.Password // Your email password
            }
        });
        console.log(process.env.Password)

        const mailOptions = {
            from: process.env.Email,
            to: student.email, // Assuming the student model has an email field
            subject: 'Enrollment Confirmation',
            text: `You have been successfully enrolled in the session "${session.topicName}".\n\n` +
                  `Start Date: ${session.startDate}\n` +
                  `End Date: ${session.endDate}\n` +
                  `Start Time: ${session.startTime}\n` +
                  `End Time: ${session.endTime}\n` +
                  `Meeting Link: ${session.meetingLink}\n\n`, // Customize as needed
            attachments: []
        };

        // Check if the media is an image and attach it
        if (session.media) {
            const filePath = path.join(__dirname, '../uploads', session.media);
            const fileExtension = path.extname(session.media).toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

            if (imageExtensions.includes(fileExtension)) {
                mailOptions.attachments.push({
                    filename: session.media,
                    path: filePath
                });
            }
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        return res.status(200).json({ msg: "Successfully enrolled in the session" });
    } catch (error) {
        console.error('Error enrolling student:', error);
        return res.status(500).json({ msg: "Internal server error" });
    }
};

const sendSessionReminders = async () => {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        console.log(`Checking for sessions starting between ${now} and ${oneHourLater}`);

        const sessions = await Session.find({
            startDate: { $lte: oneHourLater, $gte: now }
        }).populate('enrolledStudents', 'email');

        console.log(`Found ${sessions.length} sessions starting within the next hour`);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.Email,
                pass: process.env.Password
            }
        });

        sessions.forEach(session => {
            session.enrolledStudents.forEach(student => {
                const mailOptions = {
                    from: process.env.Email,
                    to: student.email,
                    subject: 'Session Reminder',
                    text: `Reminder: Your session "${session.topicName}" will start in less than an hour.\n\n` +
                          `Start Date: ${session.startDate}\n` +
                          `Start Time: ${session.startTime}\n` +
                          `Meeting Link: ${session.meetingLink}\n\n`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending reminder email:', error);
                    } else {
                        console.log('Reminder email sent: ' + info.response);
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error sending session reminders:', error);
    }
};

// Schedule the reminder function to run every 5 minutes
cron.schedule('*/5 * * * *', sendSessionReminders);

module.exports = { 
    createSession: [upload.single('media'), createSession],
    getSessions,
    enrollStudent,
    sendSessionReminders // Ensure this function is exported
};
