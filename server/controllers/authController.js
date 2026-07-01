const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      await AuditLog.create({ action: 'ADMIN_LOGIN_FAILED', adminEmail: email || 'Unknown', details: 'Invalid credentials - admin not found' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({ action: 'ADMIN_LOGIN_FAILED', adminEmail: email, details: 'Invalid credentials - password mismatch' });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token (expires in 1 hour)
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await AuditLog.create({ action: 'ADMIN_LOGIN_SUCCESS', adminEmail: email, details: 'Logged in successfully' });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, the client deletes the token.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};
