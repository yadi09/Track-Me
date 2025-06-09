import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role,
      username: user.username
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};