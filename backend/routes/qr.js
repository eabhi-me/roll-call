import express from 'express';
import QRCode from 'qrcode';
import User from '../Models/userModel.js';
import Event from '../Models/eventModel.js';
import Attendance from '../Models/attendanceModel.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate User QR Code
router.get('/generate/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own QR code or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate unique QR code data for the user
    const qrData = {
      userId: user._id.toString(),
      rollNo: user.roll_no || user.studentId,
      timestamp: Date.now(),
      type: 'user_attendance'
    };

    const qrCodeString = JSON.stringify(qrData);
    const qrCodeUrl = await QRCode.toDataURL(qrCodeString);

    // Update user's QR code data and URL in database
    await User.findByIdAndUpdate(userId, { 
      qr_code_data: qrCodeString,
      qr_code_url: qrCodeUrl 
    });

    res.json({
      message: 'QR code generated successfully',
      qrCode: {
        data: qrData,
        imageUrl: qrCodeUrl,
        userId: user._id,
        userName: user.name,
        rollNo: user.roll_no || user.studentId
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scan QR Code
router.post('/scan', adminAuth, async (req, res) => {
  try {
    const { qrData } = req.body;
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid QR code data format' });
    }

    if (!parsedData.userId && !parsedData.rollNo) {
      return res.status(400).json({ error: 'Invalid QR code data: missing userId or rollNo' });
    }

    let user;
    if (parsedData.userId) {
      user = await User.findById(parsedData.userId);
    } else if (parsedData.rollNo) {
      user = await User.findOne({ roll_no: parsedData.rollNo });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const upcomingEvents = await Event.find({
      event_type: { $in: ['Event', 'TNP Meeting'] },
      date: { $gte: new Date().toISOString().split('T')[0] },
      isActive: true
    }).sort({ date: 1, time: 1 });

    res.json({
      success: true,
      message: 'QR code scanned successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        roll_no: user.roll_no,
        trade: user.trade,
        role: user.role
      },
      events: upcomingEvents.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        event_type: event.event_type,
        date: event.date,
        time: event.time,
        location: event.location
      }))
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get User's QR Code
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own QR code or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate QR code if it doesn't exist
    if (!user.qr_code_data) {
      const qrData = {
        userId: user._id.toString(),
        rollNo: user.roll_no || user.studentId,
        timestamp: Date.now(),
        type: 'user_attendance'
      };

      const qrCodeString = JSON.stringify(qrData);
      const qrCodeUrl = await QRCode.toDataURL(qrCodeString);

      await User.findByIdAndUpdate(userId, { 
        qr_code_data: qrCodeString,
        qr_code_url: qrCodeUrl 
      });
      
      user.qr_code_data = qrCodeString;
      user.qr_code_url = qrCodeUrl;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trade: user.trade,
        roll_no: user.roll_no
      },
      qrCodeData: user.qr_code_data,
      qrCodeUrl: user.qr_code_url
    });

  } catch (error) {
    console.error('User QR code fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Regenerate User QR Code
router.post('/regenerate/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own QR code or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new QR code data
    const qrData = {
      userId: user._id.toString(),
      rollNo: user.roll_no || user.studentId,
      timestamp: Date.now(),
      type: 'user_attendance'
    };

    const qrCodeString = JSON.stringify(qrData);
    const qrCodeUrl = await QRCode.toDataURL(qrCodeString);

    // Update user's QR code data and URL
    await User.findByIdAndUpdate(userId, { 
      qr_code_data: qrCodeString,
      qr_code_url: qrCodeUrl 
    });

    res.json({
      message: 'QR code regenerated successfully',
      qrCode: {
        data: qrData,
        imageUrl: qrCodeUrl,
        userId: user._id,
        userName: user.name,
        rollNo: user.roll_no || user.studentId
      }
    });

  } catch (error) {
    console.error('QR code regeneration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate QR Code
router.post('/validate', async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    // Check if it's a user QR code
    if (parsedData.type === 'user_attendance') {
      const user = await User.findById(parsedData.userId);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: 'User not found or inactive' });
      }

      return res.json({
        valid: true,
        type: 'user',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          trade: user.trade,
          roll_no: user.roll_no
        }
      });
    }

    res.status(400).json({ error: 'Invalid QR code type' });

  } catch (error) {
    console.error('QR code validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
