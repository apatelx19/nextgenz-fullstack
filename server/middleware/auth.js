const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Check if Authorization header or query parameter is present
    let token;
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (req.query.token) {
      token = req.query.token;
    } else {
      return res.status(401).json({ success: false, message: 'Authentication failed. Token missing or invalid.' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach the admin ID to the request object
    req.adminId = decoded.id;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    res.status(401).json({ success: false, message: 'Authentication failed. Token invalid or expired.' });
  }
};

module.exports = auth;
