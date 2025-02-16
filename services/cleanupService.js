const cron = require('node-cron');
const Session = require('../model/Session');
const Student = require('../model/Student');
const fs = require('fs');
const path = require('path');

// Function to clean up expired sessions
const cleanupExpiredSessions = async () => {
    try {
        const currentDate = new Date();
        // Find sessions that have ended
        const expiredSessions = await Session.find({ endDate: { $lt: currentDate } });

        if (expiredSessions.length > 0) {
            // Loop through each expired session
            for (const session of expiredSessions) {
                // Remove the session ID from the enrolled students
                await Student.updateMany(
                    { enrolledSessions: session._id },
                    { $pull: { enrolledSessions: session._id } }
                );

                // Delete linked images or videos
                if (session.uploads && session.uploads.length > 0) {
                    for (const filePath of session.uploads) {
                        fs.unlink(path.join(__dirname, filePath), (err) => {
                            if (err) {
                                console.error(`Error deleting file ${filePath}:`, err);
                            } else {
                                console.log(`Deleted file: ${filePath}`);
                            }
                        });
                    }
                }

                // Delete the session from the database
                await Session.deleteOne({ _id: session._id });
                console.log(`Deleted session: ${session._id}`);
            }
            console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
        } else {
            console.log('No expired sessions found.');
        }
    } catch (error) {
        console.error('Error cleaning up expired sessions:', error);
    }
};

// Schedule the cleanup task to run every minute
const scheduleCleanup = () => {
    cron.schedule('* * * * *', () => {
        console.log('Running daily cleanup of expired sessions');
        cleanupExpiredSessions();
    });
};

// Export the functions
module.exports = { 
    cleanupExpiredSessions,
    scheduleCleanup
};
