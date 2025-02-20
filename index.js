const express = require('express');
const mongoose = require('mongoose');
const dotEnv = require('dotenv');
const cors = require('cors');
const studentRoutes = require('./routes/StudentRoutes');
const sessionRoutes = require('./routes/SessionRoutes');
const path = require('path');
const { scheduleCleanup } = require('./services/cleanupService');
const { sendSessionReminders } = require('./controller/SessionController'); // Import the function
const app = express();
const PORT = process.env.PORT || 4002;

dotEnv.config();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors());
app.use("/student", studentRoutes);
app.use("/session", sessionRoutes);

mongoose.connect(process.env.Mongoose_key)
    .then(() => {
        console.log("Connected to database");
        scheduleCleanup();
        sendSessionReminders(); // Call the function to ensure it is scheduled
    })
    .catch((error) => console.log("Database connection error:", error));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

