import express from 'express';
import Event from '../Models/eventModel.js';

const router = express.Router();

// Get all upcoming events and meetings (Public)
router.get('/', async (req, res) => {
  try {
    const { event_type, limit = 20, search } = req.query;
    
    const filter = { 
      isActive: true,
      date: { $gte: new Date().toISOString().split('T')[0] }
    };
    
    if (event_type) filter.event_type = event_type;

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: 1, time: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      events,
      total: events.length,
      filters: { event_type, search }
    });

  } catch (error) {
    console.error('Notices fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming events by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20 } = req.query;

    const events = await Event.find({
      isActive: true,
      date: { $gte: new Date().toISOString().split('T')[0] },
      event_type: type
    })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 })
    .limit(parseInt(limit));

    res.json({
      events,
      type,
      total: events.length
    });

  } catch (error) {
    console.error('Type notices fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's events
router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const events = await Event.find({
      isActive: true,
      date: today
    })
    .populate('createdBy', 'name email')
    .sort({ time: 1 });

    res.json({
      events,
      date: today,
      total: events.length
    });

  } catch (error) {
    console.error('Today notices fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly schedule
router.get('/weekly', async (req, res) => {
  try {
    const { startDate } = req.query;
    let start;
    
    if (startDate) {
      start = new Date(startDate);
    } else {
      start = new Date();
      start.setDate(start.getDate() - start.getDay()); // Start of current week (Sunday)
    }
    
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const events = await Event.find({
      isActive: true,
      date: { $gte: startDateStr, $lt: endDateStr }
    })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });

    // Group events by day
    const weeklySchedule = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      weeklySchedule[dateStr] = [];
    }

    events.forEach(event => {
      if (weeklySchedule[event.date]) {
        weeklySchedule[event.date].push(event);
      }
    });

    res.json({
      weeklySchedule,
      startDate: startDateStr,
      endDate: endDateStr,
      total: events.length
    });

  } catch (error) {
    console.error('Weekly schedule fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get events for next 7 days
router.get('/next-week', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const events = await Event.find({
      isActive: true,
      date: { $gte: today, $lt: nextWeekStr }
    })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });

    res.json({
      events,
      startDate: today,
      endDate: nextWeekStr,
      total: events.length
    });

  } catch (error) {
    console.error('Next week notices fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get events for next 30 days
router.get('/next-month', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const events = await Event.find({
      isActive: true,
      date: { $gte: today, $lt: nextMonthStr }
    })
    .populate('createdBy', 'name email')
    .sort({ date: 1, time: 1 });

    res.json({
      events,
      startDate: today,
      endDate: nextMonthStr,
      total: events.length
    });

  } catch (error) {
    console.error('Next month notices fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
