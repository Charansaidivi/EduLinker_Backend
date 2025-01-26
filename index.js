const express = require('express')
const mongoose = require('mongoose')
const dotEnv = require('dotenv')
const cors = require('cors')
const userRoutes = require("./routes/UserRoutes");
const app = express()
const PORT = process.env.PORT || 4000
dotEnv.config()
app.use(express.json())
app.use(cors())
app.use("/student", userRoutes);
mongoose.connect(process.env.Mongoose_key)
    .then(() => console.log("Connected to database"))
    .catch((error) => console.log("Database connection error:", error))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

