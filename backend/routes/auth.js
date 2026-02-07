const express = require('express');
const router = express.Router();
const { register, login, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { protect } = require('../middleware/auth'); // Импортируем защиту токена

// Публичные маршруты
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Приватный маршрут для обновления профиля (требует токен)
// Мы используем PUT, так как обновляем существующие данные
router.put('/profile', protect, updateProfile);

module.exports = router;