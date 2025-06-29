const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes (Yolları qorumaq üçün middleware)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// @desc    Authorize roles (Rol əsaslı icazə nəzarəti)
const authorize = (roles = []) => {
  // roles parametrini array kimi qəbul edir
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied, user not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied, user role is ${req.user.role} but allowed roles are ${roles.join(', ')}` });
    }
    next();
  };
};

module.exports = { protect, authorize };