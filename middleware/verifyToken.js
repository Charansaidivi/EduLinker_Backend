const Student = require('../model/Student')
const jwt = require('jsonwebtoken')
const dotEnv = require('dotenv')
dotEnv.config()
const secretKey = process.env.JWT_SECRET

const verifyToken = async (req, res, next) => {
    const token = req.header('token');
    console.log("Received token:", token);
    
    if (!token) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      console.log("Decoded token:", decoded);
      
      const student = await Student.findById(decoded.userId);
      console.log("Found student:", student);
      
      if (!student) {
        console.log("Student not found in database");
        return res.status(401).json({ msg: 'Student not found.' });
      }
      
      req.userId = student._id;
      req.student = student;
      console.log("Setting userId:", req.userId);
      console.log("Middleware completed successfully");
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ msg: 'Invalid token.' });
    }
  };
  
  module.exports = verifyToken;
  