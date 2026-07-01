const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// POST /api/track
// Public route to track application status
router.post('/', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'Email and phone number are required.' });
    }

    // Find the application (case insensitive email search)
    const application = await Application.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      phone: phone
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'No application found with these details.' });
    }

    // Only return safe, non-sensitive data needed for tracking
    const safeData = {
      fullName: application.fullName,
      domain: application.domain,
      status: application.status,
      paymentId: application.paymentId,
      createdAt: application.createdAt
    };

    res.json({ success: true, application: safeData });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ success: false, message: 'Server error tracking application' });
  }
});

module.exports = router;
