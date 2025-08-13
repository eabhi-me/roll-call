# QR-Based Attendance System

A modern, comprehensive attendance management system for college TNP departments, featuring QR code scanning, event management, and detailed reporting capabilities.

## 🚀 Features

### Core Functionality
- **QR Code Generation**: Unique QR codes for each student
- **QR Code Scanning**: Admin-only scanning interface with user verification
- **Event Management**: Create and manage events and TNP meetings
- **Attendance Tracking**: Real-time attendance marking and verification
- **User Management**: Student and admin role-based access
- **Database Storage**: SQLite database for users, events, and attendance records

### Advanced Features
- **PDF Export**: Generate attendance reports in PDF format
- **Filtering & Search**: Advanced filtering by date, trade, event type, and status
- **Notice Board**: Display upcoming events and meetings
- **Attendance History**: View individual student attendance records
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live attendance tracking and statistics

### User Roles
- **Students**: View attendance history, upcoming events, and personal QR codes
- **Admins**: Full system access including QR scanning, event creation, and report generation

## 🛠️ Technology Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router DOM** for navigation
- **React Hook Form** for form handling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **QRCode.react** for QR code generation

### Backend
- **Node.js** with Express.js
- **SQLite3** database
- **QRCode** library for QR generation
- **PDFKit** for PDF report generation
- **CORS** enabled for cross-origin requests

## 📁 Project Structure

```
ppp-attend/
├── backend/
│   ├── app.js                 # Main Express server
│   └── package.json           # Backend dependencies
├── ppp-client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx        # Modern landing page
│   │   │   ├── Login.jsx              # User login
│   │   │   ├── Signup.jsx             # User registration
│   │   │   ├── AdminDashboard.jsx     # Admin dashboard
│   │   │   ├── UserDashboard.jsx      # Student dashboard
│   │   │   ├── QRScanner.jsx          # QR code scanner
│   │   │   ├── CreateEvent.jsx        # Event creation
│   │   │   ├── AttendanceSheet.jsx    # Attendance records
│   │   │   ├── NoticePage.jsx         # Events and notices
│   │   │   ├── AttendanceReport.jsx   # Admin reports
│   │   │   └── LoadingPage.jsx        # Loading screen
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # App entry point
│   └── package.json           # Frontend dependencies
└── README.md                  # This file
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  trade TEXT NOT NULL,
  roll_no TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  qr_code TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table
```sql
CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT,
  max_attendees INTEGER,
  target_trade TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_id INTEGER,
  status TEXT DEFAULT 'present',
  attendance_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (event_id) REFERENCES events (id),
  FOREIGN KEY (verified_by) REFERENCES users (id)
);
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ppp-client
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   # or
   npm install --force
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## 📱 Usage Guide

### For Students
1. **Registration**: Sign up with your details (name, email, trade, roll number)
2. **Login**: Access your personal dashboard
3. **View QR Code**: Your unique QR code is displayed on your profile
4. **Attendance History**: Check your attendance records for all events
5. **Upcoming Events**: View scheduled events and meetings

### For Admins
1. **Login**: Access admin dashboard with admin credentials
2. **Create Events**: Schedule new events or TNP meetings
3. **Scan QR Codes**: Use the QR scanner to mark student attendance
4. **Generate Reports**: Export attendance data as PDF
5. **Manage Notices**: View and manage all events

### QR Code Scanning Process
1. Admin opens the QR scanner
2. Student presents their QR code
3. Admin scans the code using the scanner interface
4. System displays student details for verification
5. Admin selects the event/meeting from dropdown
6. Admin confirms attendance marking
7. System records the attendance with timestamp

## 🔧 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event

### Attendance
- `POST /api/scan-qr` - Scan QR code and get user details
- `POST /api/mark-attendance` - Mark attendance for an event
- `GET /api/attendance/:userId` - Get user attendance history
- `GET /api/attendance-report` - Get attendance report (admin)
- `GET /api/generate-pdf` - Generate PDF report

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update user profile

## 🎨 Key Features in Detail

### Modern Landing Page
- Responsive design with gradient backgrounds
- Feature showcase with animations
- Statistics display
- Call-to-action sections
- Professional navigation

### QR Scanner Interface
- Camera simulation for QR scanning
- User verification after scan
- Event selection dropdown
- Attendance confirmation
- Success feedback

### Attendance Reports
- Comprehensive filtering options
- Real-time statistics
- PDF export functionality
- Search and sort capabilities
- Visual status indicators

### Notice Board
- Event categorization (Events vs TNP Meetings)
- Date-based filtering
- Trade-specific targeting
- Urgency indicators
- Detailed event information

## 🔒 Security Features

- Role-based access control
- QR code verification
- Attendance timestamp tracking
- Admin-only QR scanning
- Secure password handling
- Session management

## 📊 Reporting & Analytics

- Attendance rate calculations
- Trade-wise statistics
- Event-specific reports
- Date range filtering
- Export capabilities
- Visual data representation

## 🎯 Future Enhancements

- Real-time notifications
- Email/SMS alerts
- Advanced analytics dashboard
- Mobile app development
- Integration with college systems
- Bulk import/export features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for modern educational institutions**
