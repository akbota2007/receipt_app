const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./backend/config/db');
const errorHandler = require('./backend/middleware/error');
const rateLimit = require('express-rate-limit');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

/**
 * --- НАСТРОЙКА ПАПКИ ДЛЯ ЗАГРУЗОК ---
 */
// Создаем папку public/uploads, если она еще не существует
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  max: 100 // лимит: 100 запросов с одного IP
});
app.use('/api/', limiter);

// Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * ВАЖНО: Разрешаем доступ к папке с загруженными изображениями
 * Теперь браузер сможет открыть картинку по пути: http://localhost:3000/uploads/имя_файла.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Mount routers (API)
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/users', require('./backend/routes/users'));
app.use('/api/receipts', require('./backend/routes/receipts'));

/**
 * --- SERVE HTML PAGES ---
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// НОВОЕ: Роут для страницы профиля
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;



app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📸 Uploads directory is ready at: ${uploadDir}`);
  console.log(`👤 Profile page available at: http://localhost:${PORT}/profile`);
});