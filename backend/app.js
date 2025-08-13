const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./attendance.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

// Create tables
function createTables() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
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
  )`);

  // Events table
  db.run(`CREATE TABLE IF NOT EXISTS events (
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
  )`);

  // Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    status TEXT DEFAULT 'present',
    attendance_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (event_id) REFERENCES events (id),
    FOREIGN KEY (verified_by) REFERENCES users (id)
  )`);
}

// Generate QR code for user
async function generateUserQR(userId, rollNo) {
  try {
    const qrData = JSON.stringify({
      userId: userId,
      rollNo: rollNo,
      timestamp: Date.now()
    });
    const qrCode = await QRCode.toDataURL(qrData);
    return qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  const { name, email, phone, trade, roll_no, password, role = 'student' } = req.body;
  
  try {
    // Generate QR code
    const qrCode = await generateUserQR(null, roll_no);
    
    db.run(
      'INSERT INTO users (name, email, phone, trade, roll_no, password, role, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, trade, roll_no, password, role, qrCode],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email or Roll No already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        // Update QR code with actual user ID
        const userId = this.lastID;
        generateUserQR(userId, roll_no).then(updatedQR => {
          db.run('UPDATE users SET qr_code = ? WHERE id = ?', [updatedQR, userId]);
        });
        
        res.json({ 
          message: 'User registered successfully',
          userId: userId,
          qrCode: qrCode
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          trade: user.trade,
          roll_no: user.roll_no,
          qr_code: user.qr_code
        }
      });
    }
  );
});

// Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events ORDER BY date DESC, time DESC', (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    res.json(events);
  });
});

// Create new event
app.post('/api/events', (req, res) => {
  const { title, description, event_type, date, time, location, max_attendees, target_trade } = req.body;
  
  db.run(
    'INSERT INTO events (title, description, event_type, date, time, location, max_attendees, target_trade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, event_type, date, time, location, max_attendees, target_trade],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create event' });
      }
      res.json({ 
        message: 'Event created successfully',
        eventId: this.lastID
      });
    }
  );
});

// Scan QR code and get user details
app.post('/api/scan-qr', (req, res) => {
  const { qrData } = req.body;
  
  try {
    const data = JSON.parse(qrData);
    const { userId, rollNo } = data;
    
    db.get(
      'SELECT * FROM users WHERE id = ? AND roll_no = ?',
      [userId, rollNo],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to verify user' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Get upcoming events
        db.all(
          'SELECT * FROM events WHERE date >= date("now") ORDER BY date, time',
          (err, events) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to fetch events' });
            }
            
            res.json({
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                trade: user.trade,
                roll_no: user.roll_no
              },
              events: events
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(400).json({ error: 'Invalid QR code data' });
  }
});

// Mark attendance
app.post('/api/mark-attendance', (req, res) => {
  const { userId, eventId, verifiedBy } = req.body;
  
  // Check if attendance already exists
  db.get(
    'SELECT * FROM attendance WHERE user_id = ? AND event_id = ?',
    [userId, eventId],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check attendance' });
      }
      
      if (existing) {
        return res.status(400).json({ error: 'Attendance already marked for this event' });
      }
      
      // Mark attendance
      db.run(
        'INSERT INTO attendance (user_id, event_id, verified_by) VALUES (?, ?, ?)',
        [userId, eventId, verifiedBy],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to mark attendance' });
          }
          res.json({ message: 'Attendance marked successfully' });
        }
      );
    }
  );
});

// Get user attendance history
app.get('/api/attendance/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(`
    SELECT 
      a.*,
      e.title as event_title,
      e.event_type,
      e.date,
      e.time,
      e.location
    FROM attendance a
    JOIN events e ON a.event_id = e.id
    WHERE a.user_id = ?
    ORDER BY e.date DESC, e.time DESC
  `, [userId], (err, attendance) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch attendance history' });
    }
    res.json(attendance);
  });
});

// Get attendance report (admin)
app.get('/api/attendance-report', (req, res) => {
  const { date, trade, event_type } = req.query;
  
  let query = `
    SELECT 
      u.name,
      u.trade,
      u.roll_no,
      e.title as event_title,
      e.event_type,
      e.date,
      a.status,
      a.attendance_time
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
    LEFT JOIN events e ON a.event_id = e.id
    WHERE u.role = 'student'
  `;
  
  const params = [];
  
  if (date) {
    query += ' AND e.date = ?';
    params.push(date);
  }
  
  if (trade) {
    query += ' AND u.trade = ?';
    params.push(trade);
  }
  
  if (event_type) {
    query += ' AND e.event_type = ?';
    params.push(event_type);
  }
  
  query += ' ORDER BY u.trade, u.name, e.date DESC';
  
  db.all(query, params, (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate report' });
    }
    res.json(report);
  });
});

// Generate PDF report
app.get('/api/generate-pdf', (req, res) => {
  const { date, trade, event_type } = req.query;
  
  let query = `
    SELECT 
      u.name,
      u.trade,
      u.roll_no,
      e.title as event_title,
      e.event_type,
      e.date,
      a.status,
      a.attendance_time
    FROM users u
    LEFT JOIN attendance a ON u.id = a.user_id
    LEFT JOIN events e ON a.event_id = e.id
    WHERE u.role = 'student'
  `;
  
  const params = [];
  
  if (date) {
    query += ' AND e.date = ?';
    params.push(date);
  }
  
  if (trade) {
    query += ' AND u.trade = ?';
    params.push(trade);
  }
  
  if (event_type) {
    query += ' AND e.event_type = ?';
    params.push(event_type);
  }
  
  query += ' ORDER BY u.trade, u.name, e.date DESC';
  
  db.all(query, params, (err, report) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to generate report' });
    }
    
    // Create PDF
    const doc = new PDFDocument();
    const filename = `attendance_report_${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    
    if (date) doc.fontSize(12).text(`Date: ${date}`);
    if (trade) doc.fontSize(12).text(`Trade: ${trade}`);
    if (event_type) doc.fontSize(12).text(`Event Type: ${event_type}`);
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Name', 50, tableTop);
    doc.text('Trade', 150, tableTop);
    doc.text('Roll No', 220, tableTop);
    doc.text('Event', 280, tableTop);
    doc.text('Status', 400, tableTop);
    doc.text('Date', 450, tableTop);
    
    doc.moveDown();
    
    // Table data
    report.forEach((row, index) => {
      const y = tableTop + 30 + (index * 20);
      doc.text(row.name || 'N/A', 50, y);
      doc.text(row.trade || 'N/A', 150, y);
      doc.text(row.roll_no || 'N/A', 220, y);
      doc.text(row.event_title || 'N/A', 280, y);
      doc.text(row.status || 'Absent', 400, y);
      doc.text(row.date || 'N/A', 450, y);
    });
    
    doc.end();
  });
});

// Get all users (admin)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email, trade, roll_no, role FROM users ORDER BY name', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(users);
  });
});

// Get user profile
app.get('/api/profile/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    delete user.password;
    res.json(user);
  });
});

// Update user profile
app.put('/api/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, trade } = req.body;
  
  db.run(
    'UPDATE users SET name = ?, email = ?, phone = ?, trade = ? WHERE id = ?',
    [name, email, phone, trade, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
