const User=require('../model/Student')
const jwt= require('jsonwebtoken')
const dotEnv=require('dotenv')
dotEnv.config()
const secretKey=process.env.JWT_SECRET
const verifyToken = async (req, res, next) => {
    const token = req.header('token');
    if (!token) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ msg: 'User not found.' });
      }
      req.userId = user._id;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Invalid token.' });
    }
  };
  
  module.exports = verifyToken;
  