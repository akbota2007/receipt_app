const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.put('/profile', protect, updateProfile);

module.exports = router;