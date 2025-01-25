const express = require('express')
const mongoose = require('mongoose')
const dotEnv = require('dotenv')

const app = express()
const PORT = process.env.PORT || 5000

dotEnv.config()

mongoose.connect(process.env.Mongoose_key)
    .then(() => console.log("Connected to database"))
    .catch((error) => console.log("Database connection error:", error))

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
