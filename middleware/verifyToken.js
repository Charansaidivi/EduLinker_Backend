const Student = require('../model/Student')
const jwt = require('jsonwebtoken')
const dotEnv = require('dotenv')
dotEnv.config()
const secretKey = process.env.JWT_SECRET

const verifyToken = async (req, res, next) => {
    const token = req.header('token');
    if (!token) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      const student = await Student.findById(decoded.userId);
      
      if (!student) {
        return res.status(401).json({ msg: 'Student not found.' });
      }
      req.userId = student._id;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Invalid token.' });
    }
  };
  
  module.exports = verifyToken;
  