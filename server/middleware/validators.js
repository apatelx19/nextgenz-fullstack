const { body, validationResult } = require('express-validator');

// Validation logic for application form
exports.validateApplication = [
  body('applicationData.fullName').trim().notEmpty().withMessage('Full Name is required').escape(),
  body('applicationData.email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('applicationData.phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone('any').withMessage('Invalid phone number'),
  body('applicationData.college').trim().notEmpty().withMessage('College is required').escape(),
  body('applicationData.course').trim().notEmpty().withMessage('Course is required').escape(),
  body('applicationData.year').trim().notEmpty().withMessage('Year is required').escape(),
  body('applicationData.domain').trim().notEmpty().withMessage('Domain is required').escape(),
  body('applicationData.linkedin').optional({ checkFalsy: true }).isURL().withMessage('Valid LinkedIn URL is required'),
  body('applicationData.github').optional({ checkFalsy: true }).isURL().withMessage('Valid GitHub URL is required'),
  body('applicationData.whyJoin').trim().notEmpty().withMessage('Reason to join is required').escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

// Validation logic for Admin Login
exports.validateAdminLogin = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
