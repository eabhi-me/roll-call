# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites Check
- ✅ Node.js (v18+) installed
- ✅ MongoDB running locally
- ✅ Git installed

### Step 1: Clone and Setup
```bash
git clone <your-repo-url>
cd ppp-attend
```

### Step 2: Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env file with your MongoDB URL and JWT secret
npm run dev
```

### Step 3: Frontend Setup (in new terminal)
```bash
cd ppp-client
npm install
npm run dev
```

### Step 4: Access the System
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend API: http://localhost:5000
- 📊 API Docs: http://localhost:5000

## 🎯 Quick Test

### 1. Create Admin Account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. Login to Frontend
- Go to http://localhost:5173
- Click "Sign In"
- Use admin@test.com / admin123

### 3. Create Your First Event
- Navigate to "Create Event"
- Fill in event details
- Submit to create event with QR code

## 🔧 Troubleshooting

### Common Issues:

**MongoDB Connection Error**
```bash
# Start MongoDB (Windows)
net start MongoDB

# Start MongoDB (Mac/Linux)
sudo systemctl start mongod
```

**Port Already in Use**
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

**CORS Errors**
- Check FRONTEND_URL in backend/.env
- Ensure frontend is running on correct port

## 📱 System Features

- **User Management**: Create admin and student accounts
- **Event Creation**: Schedule events with QR codes
- **QR Scanning**: Mark attendance by scanning student QR codes
- **Reports**: View attendance statistics and reports
- **Dashboard**: Separate views for admin and students

## 🆘 Need Help?

1. Check the main README.md for detailed documentation
2. Verify all environment variables are set correctly
3. Check console logs for error messages
4. Ensure MongoDB is running and accessible

## 🎉 You're All Set!

The TNP Attendance Management System is now running successfully. Start creating events, adding students, and tracking attendance!
