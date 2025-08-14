# TNP Attendance Management System

A comprehensive attendance management system built with React frontend and Node.js backend, featuring QR code-based attendance tracking, user management, and detailed reporting.

## Features

### Frontend (React + Vite)
- **Modern UI**: Built with Tailwind CSS and Framer Motion
- **Responsive Design**: Mobile-first approach
- **Role-based Access**: Separate dashboards for admin and regular users
- **QR Code Integration**: Generate and scan QR codes for attendance
- **Real-time Updates**: Live attendance tracking and reporting

### Backend (Node.js + Express + MongoDB)
- **RESTful API**: Complete CRUD operations for all entities
- **Authentication**: JWT-based secure authentication
- **Role-based Authorization**: Admin and user role management
- **Data Validation**: Input validation and sanitization
- **QR Code Generation**: Dynamic QR code creation for events and users

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router DOM
- Framer Motion
- React Hook Form
- React Hot Toast
- QRCode.react
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- QRCode generation
- Express Validator

## Project Structure

```
ppp-attend/
├── backend/                 # Backend server
│   ├── Models/             # MongoDB schemas
│   ├── middleware/         # Auth and validation middleware
│   ├── routes/             # API route handlers
│   ├── database/           # Database connection
│   ├── index.js            # Main server file
│   └── package.json        # Backend dependencies
├── ppp-client/             # Frontend React app
│   ├── src/
│   │   ├── pages/          # React components
│   │   ├── services/       # API service layer
│   │   └── assets/         # Static assets
│   └── package.json        # Frontend dependencies
└── README.md               # This file
```

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ppp-attend
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your configuration
# MONGODB_URL=mongodb://localhost:27017/tnp_attendance
# JWT_SECRET=your_secret_key_here
# FRONTEND_URL=http://localhost:5173

# Start the server
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ppp-client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URL=mongodb://localhost:27017/tnp_attendance
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Events
- `POST /api/events` - Create event (admin only)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Delete event (admin only)

### Attendance
- `POST /api/attendance/mark` - Mark attendance (admin only)
- `GET /api/attendance/user/:userId` - Get user attendance
- `GET /api/attendance/event/:eventId` - Get event attendance
- `GET /api/attendance/report/overview` - Get attendance report
- `GET /api/attendance/my-attendance` - Get current user's attendance

### QR Codes
- `GET /api/qr/generate/:userId` - Generate user QR code
- `POST /api/qr/scan` - Scan QR code (admin only)
- `GET /api/qr/user/:userId` - Get user's QR code
- `GET /api/qr/event/:eventId` - Get event QR code

### Users (Admin Only)
- `GET /api/users` - Get all users
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user
- `GET /api/users/stats/overview` - Get user statistics

## Usage

### 1. Create Admin Account
First, create an admin account using the registration endpoint:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "admin"
  }'
```

### 2. Create Regular Users
Create student accounts:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user",
    "trade": "Computer Science",
    "roll_no": "CS001"
  }'
```

### 3. Create Events
As an admin, create events:
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "TNP Meeting",
    "description": "Weekly TNP meeting",
    "date": "2024-01-20",
    "time": "10:00",
    "location": "Auditorium",
    "event_type": "TNP Meeting",
    "department": "Computer Science"
  }'
```

### 4. Mark Attendance
Scan QR codes or manually mark attendance:
```bash
curl -X POST http://localhost:5000/api/attendance/mark \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "eventId": "EVENT_ID",
    "status": "present"
  }'
```

## Frontend Integration

The frontend is already integrated with the backend through the API service layer. Key integration points:

1. **Authentication**: Login/register forms connect to auth endpoints
2. **Event Management**: Create, view, and manage events
3. **QR Code Scanning**: Real-time attendance marking
4. **Attendance Reports**: View and export attendance data
5. **User Management**: Admin dashboard for user administration

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd ppp-client
npm run dev  # Start Vite dev server
```

### Database
- MongoDB connection is handled automatically
- Models include proper indexing for performance
- Soft delete implemented for data integrity

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure MongoDB connection string
4. Set up proper CORS origins
5. Use PM2 or similar process manager

### Frontend
1. Build the project: `npm run build`
2. Serve static files from a web server
3. Update API base URL for production
4. Configure environment variables

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Secure HTTP headers

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in .env
   - Verify database permissions

2. **CORS Errors**
   - Check FRONTEND_URL in backend .env
   - Ensure frontend is running on correct port

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure Authorization header format

4. **Port Conflicts**
   - Backend: Change PORT in .env
   - Frontend: Change port in package.json scripts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Check console logs for errors
- Verify environment configuration
