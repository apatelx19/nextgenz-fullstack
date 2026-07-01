const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateAdminLogin } = require('../middleware/validators');

router.post('/login', validateAdminLogin, authController.login);
router.post('/logout', authController.logout);

module.exports = router;
