import express from 'express';
import PDFDocument from 'pdfkit';
import Attendance from '../Models/attendanceModel.js';
import Event from '../Models/eventModel.js';
import User from '../Models/userModel.js';
import { adminAuth, userAuth } from '../middleware/auth.js';
import { validateAttendanceMarking } from '../middleware/validation.js';

const router = express.Router();

// Mark Attendance
router.post('/mark', adminAuth, validateAttendanceMarking, async (req, res) => {
  try {
    const { userId, eventId, status } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }


    // Check if attendance already exists for this user and event
    const existingAttendance = await Attendance.findOne({
      user_id: userId,
      event_id: eventId
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.verified_by = req.user._id;
      existingAttendance.verified_by_snapshot = {
        name: req.user.name,
        email: req.user.email
      };
      
      await existingAttendance.save();

      // Update event attendee count
      await event.updateAttendeeCount();

      res.json({
        message: 'Attendance updated successfully',
        attendance: existingAttendance
      });
    } else {
      // Create new attendance record
      const attendance = new Attendance({
        user_id: userId,
        event_id: eventId,
        status: status,
        verified_by: req.user._id,
        verified_by_snapshot: {
          name: req.user.name,
          email: req.user.email
        }
      });

      await attendance.save();

      // Update event attendee count
      await event.updateAttendeeCount();

      res.status(201).json({
        message: 'Attendance marked successfully',
        attendance: attendance
      });
    }

  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Attendance History
router.get('/user/:userId', userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status, event_type, date_from, date_to } = req.query;

    // Check if user is requesting their own data or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this attendance data' });
    }

    const filter = { user_id: userId };

    if (status) filter.status = status;
    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find(filter)
      .populate('event_id', 'title event_type date time location')
      .populate('verified_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    // Flatten to minimal fields for My Attendance page (keep eventType for filtering if needed)
    const flattened = attendance.map((r) => ({
      _id: r._id,
      eventName: r.event_id?.title || '',
      date: r.event_id?.date || '',
      time: r.event_id?.time || '',
      status: r.status,
      eventType: r.event_id?.event_type || '',
      createdAt: r.createdAt,
    }));

    // Get attendance statistics
    const stats = await Attendance.getStats({ user_id: userId });

    res.json({
      success: true,
      attendance: flattened,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      },
      stats: stats
    });

  } catch (error) {
    console.error('Get user attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Event Attendance
router.get('/event/:eventId', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = { event_id: eventId };

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    let attendance = await Attendance.find(filter)
      .populate('user_id', 'name email roll_no trade')
      .populate('event_id', 'title event_type date time location')
      .populate('verified_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter
    if (search) {
      attendance = attendance.filter(record =>
        record.user_id.name.toLowerCase().includes(search.toLowerCase()) ||
        record.user_id.roll_no.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Attendance.countDocuments(filter);

    // Get attendance statistics for this event
    const stats = await Attendance.getStats({ event_id: eventId });

    // Flatten for client and include admin/verifier name snapshot
    const flattened = attendance.map((r) => ({
      id: r._id,
      studentName: r.user_id?.name || '',
      studentId: r.user_id?.roll_no || '',
      email: r.user_id?.email || '',
      department: r.user_id?.trade || '',
      status: r.status,
      eventName: r.event_id?.title || '',
      date: r.event_id?.date || '',
      attendanceTime: r.event_id?.time || '',
      verifiedByName: r.verified_by_snapshot?.name || r.verified_by?.name || '',
      verifiedByEmail: r.verified_by_snapshot?.email || r.verified_by?.email || '',
      createdAt: r.createdAt
    }));

    res.json({
      success: true,
      attendance: flattened,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      },
      stats: stats
    });

  } catch (error) {
    console.error('Get event attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Attendance Report (Admin only)
router.get('/report', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      event_type,
      date_from,
      date_to,
      search,
      trade
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    const skip = (page - 1) * limit;

    let attendance = await Attendance.find(filter)
      .populate('user_id', 'name email roll_no trade')
      .populate('event_id', 'title event_type date time location')
      .populate('verified_by', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply event type filter
    if (event_type) {
      attendance = attendance.filter(record => 
        record.event_id.event_type === event_type
      );
    }

    // Apply trade filter
    if (trade && trade !== 'all') {
      attendance = attendance.filter(record => 
        record.user_id.trade === trade
      );
    }

    // Apply search filter
    if (search) {
      attendance = attendance.filter(record =>
        record.user_id.name.toLowerCase().includes(search.toLowerCase()) ||
        record.user_id.roll_no.toLowerCase().includes(search.toLowerCase()) ||
        record.event_id.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Attendance.countDocuments(filter);

    // Flatten for client consumption (include verifier/admin name)
    const flattened = attendance.map((r) => ({
      _id: r._id,
      studentName: r.user_id?.name || '',
      studentId: r.user_id?.roll_no || '',
      trade: r.user_id?.trade || '',
      eventName: r.event_id?.title || '',
      date: r.event_id?.date || '',
      attendanceTime: r.event_id?.time || '',
      status: r.status,
      eventType: r.event_id?.event_type || '',
      createdAt: r.createdAt,
      verifiedByName: r.verified_by_snapshot?.name || r.verified_by?.name || ''
    }));

    // Get overall statistics
    const stats = await Attendance.getStats();

    res.json({
      success: true,
      attendance: flattened,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalRecords: total
      },
      stats: stats
    });

  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Attendance Report PDF (Admin only)
router.get('/report/pdf', adminAuth, async (req, res) => {
  try {
    const {
      status,
      event_type,
      date_from,
      date_to,
      search,
      trade
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    let attendance = await Attendance.find(filter)
      .populate('user_id', 'name email roll_no trade')
      .populate('event_id', 'title event_type date time location')
      .populate('verified_by', 'name email')
      .sort({ createdAt: -1 });

    // Apply event type filter
    if (event_type) {
      attendance = attendance.filter(record => 
        record.event_id.event_type === event_type
      );
    }

    // Apply trade filter
    if (trade && trade !== 'all') {
      attendance = attendance.filter(record => 
        record.user_id.trade === trade
      );
    }

    // Apply search filter
    if (search) {
      attendance = attendance.filter(record =>
        record.user_id.name.toLowerCase().includes(search.toLowerCase()) ||
        record.user_id.roll_no.toLowerCase().includes(search.toLowerCase()) ||
        record.event_id.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Generate PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Generate dynamic filename based on filters
    let filename = 'attendance-report';
    if (status) filename += `-${status}`;
    if (event_type) filename += `-${event_type.replace(/\s+/g, '-').toLowerCase()}`;
    if (trade && trade !== 'all') filename += `-${trade.replace(/\s+/g, '-').toLowerCase()}`;
    if (date_from || date_to) {
      if (date_from && date_to) {
        filename += `-${date_from}-to-${date_to}`;
      } else if (date_from) {
        filename += `-from-${date_from}`;
      } else if (date_to) {
        filename += `-until-${date_to}`;
      }
    }
    filename += `.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    // Pipe PDF to response
    doc.pipe(res);

    // Simple header
    doc.fontSize(18).font('Helvetica-Bold').text('ATTENDANCE REPORT', { align: 'center' });
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Simple filters info
    if (status || event_type || trade || date_from || date_to || search) {
      doc.fontSize(10).font('Helvetica').text('Applied Filters: ');
      
      let filters = [];
      if (status) filters.push(`Status: ${status}`);
      if (event_type) filters.push(`Event Type: ${event_type}`);
      if (trade && trade !== 'all') filters.push(`Trade: ${trade}`);
      if (date_from && date_to) filters.push(`Date: ${date_from} to ${date_to}`);
      if (search) filters.push(`Search: "${search}"`);
      
      doc.text(filters.join(', '));
      doc.moveDown();
    }
    
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    // Simple table configuration
    const tableTop = doc.y;
    const leftMargin = 50;
    const colWidths = [30, 120, 70, 90, 130, 60, 70]; // S.No, Name, Roll No, Trade, Event, Status, Date
    const rowHeight = 25;
    
    let currentY = tableTop;
    
    // Simple table header
    doc.fontSize(10).font('Helvetica-Bold');
    
    // Header background
    doc.rect(leftMargin, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
       .fillAndStroke('#f0f0f0', '#000000');
    
    // Header text
    doc.fillColor('#000000');
    const headers = ['S.No', 'Name', 'Roll No', 'Trade', 'Event', 'Status', 'Date'];
    let xPos = leftMargin;
    
    headers.forEach((header, i) => {
      doc.text(header, xPos + 5, currentY + 8, { width: colWidths[i] - 10 });
      xPos += colWidths[i];
    });

    currentY += rowHeight;

    // Add attendance records
    doc.font('Helvetica').fontSize(9);
    
    attendance.forEach((record, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        
        // Repeat header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.rect(leftMargin, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
           .fillAndStroke('#f0f0f0', '#000000');
        
        doc.fillColor('#000000');
        xPos = leftMargin;
        headers.forEach((header, i) => {
          doc.text(header, xPos + 5, currentY + 8, { width: colWidths[i] - 10 });
          xPos += colWidths[i];
        });
        currentY += rowHeight;
        doc.font('Helvetica').fontSize(9);
      }

      const name = record.user_id?.name || 'N/A';
      const roll = record.user_id?.roll_no || 'N/A';
      const trade = record.user_id?.trade || 'N/A';
      const event = record.event_id?.title || 'N/A';
      const status = record.status || 'N/A';
      const date = record.createdAt ? record.createdAt.toLocaleDateString() : 'N/A';

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(leftMargin, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
           .fill('#f9f9f9');
      }

      // Row borders
      doc.rect(leftMargin, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight)
         .stroke('#cccccc');

      // Status color
      let statusColor = '#000000';
      if (status === 'present') statusColor = '#28a745';
      else if (status === 'absent') statusColor = '#dc3545';

      // Cell content
      doc.fillColor('#000000');
      xPos = leftMargin;
      
      const cellData = [
        (index + 1).toString(),
        name.length > 15 ? name.substring(0, 15) + '...' : name,
        roll,
        trade.length > 12 ? trade.substring(0, 12) + '...' : trade,
        event.length > 18 ? event.substring(0, 18) + '...' : event,
        status,
        date
      ];
      
      cellData.forEach((data, i) => {
        if (i === 5) { // Status column
          doc.fillColor(statusColor);
          doc.text(data.toUpperCase(), xPos + 5, currentY + 8, { width: colWidths[i] - 10 });
          doc.fillColor('#000000');
        } else {
          doc.text(data, xPos + 5, currentY + 8, { width: colWidths[i] - 10 });
        }
        xPos += colWidths[i];
      });

      // Vertical lines
      xPos = leftMargin;
      colWidths.forEach(width => {
        doc.moveTo(xPos, currentY).lineTo(xPos, currentY + rowHeight).stroke('#cccccc');
        xPos += width;
      });
      doc.moveTo(xPos, currentY).lineTo(xPos, currentY + rowHeight).stroke('#cccccc');

      currentY += rowHeight;
    });

    // Simple footer
    doc.moveDown();
    doc.fontSize(8).text(`Total Records: ${attendance.length} | Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Overall Attendance Statistics (Admin Dashboard)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const { date_from, date_to, event_type } = req.query;

    const filter = {};

    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    // Get basic stats
    const basicStats = await Attendance.getStats(filter);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = {
      ...filter,
      createdAt: { $gte: today, $lt: tomorrow }
    };
    const todayStats = await Attendance.getStats(todayFilter);

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekFilter = {
      ...filter,
      createdAt: { $gte: weekStart, $lt: weekEnd }
    };
    const weekStats = await Attendance.getStats(weekFilter);

    // Get this month's attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthFilter = {
      ...filter,
      createdAt: { $gte: monthStart, $lt: monthEnd }
    };
    const monthStats = await Attendance.getStats(monthFilter);

    // Get attendance by event type
    const eventTypeStats = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event.event_type',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    // Get recent attendance records
    const recentAttendance = await Attendance.find(filter)
      .populate('user_id', 'name roll_no trade')
      .populate('event_id', 'title event_type date')
      .populate('verified_by', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get top events by attendance
    const topEvents = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event_id',
          eventTitle: { $first: '$event.title' },
          eventType: { $first: '$event.event_type' },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overall: basicStats,
        today: todayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
        byEventType: eventTypeStats,
        recentAttendance: recentAttendance,
        topEvents: topEvents
      }
    });

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Dashboard Statistics
router.get('/user-stats/:userId', userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { date_from, date_to } = req.query;

    // Check if user is requesting their own data or is admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this data' });
    }

    const filter = { user_id: userId };

    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    // Get basic stats
    const basicStats = await Attendance.getStats(filter);

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFilter = {
      ...filter,
      createdAt: { $gte: today, $lt: tomorrow }
    };
    const todayStats = await Attendance.getStats(todayFilter);

    // Get this week's attendance
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekFilter = {
      ...filter,
      createdAt: { $gte: weekStart, $lt: weekEnd }
    };
    const weekStats = await Attendance.getStats(weekFilter);

    // Get this month's attendance
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const monthFilter = {
      ...filter,
      createdAt: { $gte: monthStart, $lt: monthEnd }
    };
    const monthStats = await Attendance.getStats(monthFilter);

    // Get attendance by event type
    const eventTypeStats = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $group: {
          _id: '$event.event_type',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    // Get recent attendance records
    const recentAttendance = await Attendance.find(filter)
      .populate('event_id', 'title event_type date time location')
      .populate('verified_by', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get attendance trend (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayFilter = {
        ...filter,
        createdAt: { $gte: date, $lt: nextDate }
      };
      const dayStats = await Attendance.getStats(dayFilter);

      trendData.push({
        date: date.toISOString().split('T')[0],
        present: dayStats.present,
        absent: dayStats.absent,
        total: dayStats.total
      });
    }

    res.json({
      success: true,
      data: {
        overall: basicStats,
        today: todayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
        byEventType: eventTypeStats,
        recentAttendance: recentAttendance,
        trend: trendData
      }
    });

  } catch (error) {
    console.error('Get user attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Event Attendance Statistics
router.get('/event-stats/:eventId', adminAuth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const filter = { event_id: eventId };

    // Get basic stats
    const basicStats = await Attendance.getStats(filter);

    // Get attendance by trade
    const tradeStats = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.trade',
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      }
    ]);

    // Get attendance over time (if event has multiple sessions)
    const timeStats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top attendees
    const topAttendees = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user_id',
          name: { $first: '$user.name' },
          rollNo: { $first: '$user.roll_no' },
          trade: { $first: '$user.trade' },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { present: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overall: basicStats,
        byTrade: tradeStats,
        overTime: timeStats,
        topAttendees: topAttendees
      }
    });

  } catch (error) {
    console.error('Get event attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
