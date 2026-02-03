# 📝 Receipt App - Modern Expense Management System

A beautiful, full-stack web application for managing receipts and tracking expenses. Built with Node.js, Express, MongoDB, and a stunning responsive frontend.

## 🌟 Features

### Core Functionality
- ✅ **User Authentication**: Secure registration and login with JWT
- ✅ **Receipt Management**: Create, read, update, and delete receipts
- ✅ **Categories**: Organize receipts by category (Food, Shopping, Travel, etc.)
- ✅ **Statistics Dashboard**: View total expenses, receipt count, and monthly summaries
- ✅ **Advanced Filtering**: Filter by category, date range, and search
- ✅ **Like System**: Favorite your important receipts
- ✅ **Image Support**: Add images to your receipts

### Advanced Features
- ✅ **Role-Based Access Control (RBAC)**: Admin, Premium, and User roles
- ✅ **Email Notifications**: Welcome emails on registration (optional)
- ✅ **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- ✅ **Beautiful UI**: Modern gradient design with smooth animations
- ✅ **Data Validation**: Comprehensive validation using Joi
- ✅ **Error Handling**: Global error handling middleware
- ✅ **Rate Limiting**: API protection with rate limiting

## 🎨 Screenshots

### Landing Page
Beautiful gradient landing page with call-to-action buttons.

### Dashboard
- Statistics cards showing total receipts, expenses, and monthly summary
- Advanced filters for category, date range, and search
- Beautiful receipt cards with images and details

### Receipt Management
- Add/Edit receipts with comprehensive form
- Multiple payment methods
- Category badges
- Like/favorite system

## 🚀 Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Joi** - Data validation
- **Nodemailer** - Email service

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with gradients and animations
- **JavaScript (ES6+)** - Interactivity
- **Fetch API** - HTTP requests
- **Google Fonts (Inter)** - Typography

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or MongoDB installed locally)

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd receipt-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
JWT_SECRET=d9407e69f2d0e28fd37b069e0d89155b0828fd8c5e0e17202904a6f0bcdae7e8
JWT_EXPIRE=7d
PORT=3001

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Receipt App <noreply@receiptapp.com>
```

### 4. Run the application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The application will start on `http://localhost:3001`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "avatar_url"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### User Endpoints (Private)

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "new_username",
  "email": "new_email@example.com",
  "avatar": "new_avatar_url"
}
```

### Receipt Endpoints (Private)

#### Create Receipt
```http
POST /api/receipts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Lunch at Restaurant",
  "merchant": "Starbucks",
  "amount": 25.50,
  "currency": "KZT",
  "category": "Food & Dining",
  "date": "2024-02-02",
  "paymentMethod": "Credit Card",
  "description": "Team lunch meeting",
  "imageUrl": "https://example.com/receipt.jpg"
}
```

#### Get All Receipts
```http
GET /api/receipts
Authorization: Bearer <token>

# Optional query parameters:
?category=Food%20%26%20Dining
&startDate=2024-01-01
&endDate=2024-02-02
&search=starbucks
```

#### Get Single Receipt
```http
GET /api/receipts/:id
Authorization: Bearer <token>
```

#### Update Receipt
```http
PUT /api/receipts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "amount": 30.00
}
```

#### Delete Receipt
```http
DELETE /api/receipts/:id
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/receipts/stats/summary
Authorization: Bearer <token>
```

#### Toggle Like
```http
POST /api/receipts/:id/like
Authorization: Bearer <token>
```

### Admin Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users
Authorization: Bearer <admin_token>
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin_token>
```

#### Update User Role
```http
PUT /api/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "premium"
}
```

## 🗂️ Project Structure

```
receipt-app/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User management
│   │   └── receiptController.js  # Receipt operations
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── validation.js         # Data validation
│   │   └── error.js              # Error handling
│   ├── models/
│   │   ├── User.js               # User schema
│   │   └── Receipt.js            # Receipt schema
│   └── routes/
│       ├── auth.js               # Auth routes
│       ├── users.js              # User routes
│       └── receipts.js           # Receipt routes
├── public/
│   ├── css/
│   │   └── style.css             # Main stylesheet
│   └── js/
│       ├── auth.js               # Auth page logic
│       └── dashboard.js          # Dashboard logic
├── views/
│   ├── index.html                # Landing page
│   ├── login.html                # Login page
│   ├── register.html             # Registration page
│   └── dashboard.html            # Main dashboard
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Dependencies
├── server.js                     # Main server file
└── README.md                     # Documentation
```

## 🎯 Database Schema

### User Collection
```javascript
{
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  password: String (hashed, min 6 chars),
  role: String (enum: 'user', 'premium', 'admin'),
  avatar: String (URL),
  favorites: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### Receipt Collection
```javascript
{
  title: String (max 100 chars),
  merchant: String,
  amount: Number (min 0),
  currency: String (enum: 'USD', 'EUR', 'GBP', 'KZT', 'RUB'),
  category: String (enum: categories),
  date: Date,
  description: String (max 500 chars),
  paymentMethod: String (enum: methods),
  imageUrl: String,
  tags: [String],
  user: ObjectId (ref: User),
  status: String (enum: 'pending', 'approved', 'rejected'),
  likedBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

## 🌐 Deployment

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy!

### Deploy to Railway

1. Create account on [Railway](https://railway.app)
2. Create new project from GitHub
3. Add environment variables
4. Deploy automatically

### Deploy to Replit

1. Import from GitHub on [Replit](https://replit.com)
2. Add secrets (environment variables)
3. Run the project

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected routes with middleware
- ✅ Input validation with Joi
- ✅ Rate limiting to prevent abuse
- ✅ CORS enabled
- ✅ Environment variables for sensitive data
- ✅ Role-based access control

## 👥 Team Members & Responsibilities

- **[Akbota]** - Full-stack development, database design, authentication
- **[Altynay]** - Frontend design, UI/UX, responsive layout
- **[Nuray]** - API development, testing, documentation

## 📝 Testing the Application

### Manual Testing Steps

1. **Registration**
   - Open `http://localhost:3001/register`
   - Create a new account
   - Verify email validation works

2. **Login**
   - Login with created credentials
   - Should redirect to dashboard

3. **Create Receipt**
   - Click "Add Receipt" button
   - Fill in all fields
   - Submit and verify it appears in the list

4. **Filter Receipts**
   - Try filtering by category
   - Test date range filtering
   - Use search functionality

5. **Edit/Delete Receipt**
   - Click edit button on a receipt
   - Modify details and save
   - Try deleting a receipt

6. **Statistics**
   - Verify statistics update correctly
   - Check monthly calculations

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to MongoDB:**
- Check your MONGO_URI in .env file
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify network connection

**Port already in use:**
- Change PORT in .env file
- Kill the process using the port: `lsof -ti:3000 | xargs kill`

**JWT errors:**
- Check JWT_SECRET is set in .env
- Clear localStorage and login again

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Express.js community
- All open-source contributors


---

