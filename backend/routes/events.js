import express from 'express';
import Event from '../Models/eventModel.js';
import { adminAuth, userAuth } from '../middleware/auth.js';
import { validateEventCreation, validateEventUpdate } from '../middleware/validation.js';

const router = express.Router();

// Create Event (Admin only)
router.post('/', adminAuth, validateEventCreation, async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      date,
      time,
      location
    } = req.body;

    const event = new Event({
      title,
      description,
      event_type,
      date,
      time,
      location,
      createdBy: req.user._id
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event: event
    });

  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get All Events (with filtering and pagination)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      event_type,
      date_from,
      date_to,
      search
    } = req.query;

    const filter = { isActive: true };

    // Apply filters
    if (event_type) filter.event_type = event_type;
    
    // Date range filter
    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = date_from;
      if (date_to) filter.date.$lte = date_to;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      events: events,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        totalEvents: total
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Upcoming Events
router.get('/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const filter = {
      isActive: true,
      date: { $gte: today }
    };

    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      events: events,
      count: events.length
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Active Events (yesterday, today, tomorrow)
router.get('/active', async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const events = await Event.find({ 
      isActive: true, 
      date: { $in: [yesterdayStr, todayStr, tomorrowStr] }
    })
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 });

    res.json({ success: true, events: events, count: events.length });
  } catch (error) {
    console.error('Get active events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event || !event.isActive) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: event });

  } catch (error) {
    console.error('Get event error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Event (Admin only)
router.put('/:id', adminAuth, validateEventUpdate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the creator or admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    const updateFields = req.body;
    delete updateFields.createdBy; // Prevent changing creator

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete Event (Admin only - soft delete)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the creator or admin
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Soft delete
    event.isActive = false;
    await event.save();

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Event Statistics (Admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const stats = await Event.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
          totalAttendees: { $sum: '$attendee_count' }
        }
      }
    ]);

    const result = {
      total: 0,
      totalAttendees: 0,
      byType: {}
    };

    stats.forEach(stat => {
      result.total += stat.count;
      result.totalAttendees += stat.totalAttendees;
      result.byType[stat._id] = {
        count: stat.count,
        attendees: stat.totalAttendees
      };
    });

    res.json({ stats: result });

  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
