import express from 'express';
import User from '../Models/userModel.js';
import Attendance from '../Models/attendanceModel.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get All Users (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search, status } = req.query;

    const filter = {};
    
    if (role) filter.role = role;
    if (department && department !== 'All Departments') filter.department = department;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { roll_no: { $regex: search, $options: 'i' } },
        { trade: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password_hash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User by ID (Admin only)
router.get('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password_hash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's attendance statistics
    const totalEvents = await Attendance.countDocuments({ user_id: userId });
    const attended = await Attendance.countDocuments({ user_id: userId, status: 'present' });
    const absent = await Attendance.countDocuments({ user_id: userId, status: 'absent' });
    const late = await Attendance.countDocuments({ user_id: userId, status: 'late' });

    const attendanceStats = {
      totalEvents,
      attended,
      absent,
      late,
      attendanceRate: totalEvents > 0 ? Math.round((attended / totalEvents) * 100) : 0
    };

    res.json({
      user,
      attendanceStats
    });

  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update User (Admin only)
router.put('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, trade, roll_no, department, role, isActive } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (trade !== undefined) updateData.trade = trade;
    if (roll_no !== undefined) updateData.roll_no = roll_no;
    if (department !== undefined) updateData.department = department;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Check if roll number already exists (if being updated)
    if (roll_no) {
      const existingUser = await User.findOne({ roll_no, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this roll number already exists' });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete User (Admin only)
router.delete('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user has any attendance records
    const attendanceCount = await Attendance.countDocuments({ user_id: userId });
    
    if (attendanceCount > 0) {
      // Soft delete - mark as inactive
      await User.findByIdAndUpdate(userId, { isActive: false });
      res.json({ message: 'User deactivated successfully (has attendance records)' });
    } else {
      // Hard delete if no attendance records
      await User.findByIdAndDelete(userId);
      res.json({ message: 'User deleted successfully' });
    }

  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Users by Department (Admin only)
router.get('/department/:department', adminAuth, async (req, res) => {
  try {
    const { department } = req.params;
    const { page = 1, limit = 10, role, status } = req.query;

    const filter = { department };
    
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password_hash')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      department,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total
      }
    });

  } catch (error) {
    console.error('Department users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Statistics (Admin only)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const { department } = req.query;

    const filter = {};
    if (department && department !== 'All Departments') {
      filter.department = department;
    }

    // Get user counts
    const totalUsers = await User.countDocuments(filter);
    const activeUsers = await User.countDocuments({ ...filter, isActive: true });
    const inactiveUsers = await User.countDocuments({ ...filter, isActive: false });
    const adminUsers = await User.countDocuments({ ...filter, role: 'admin' });
    const regularUsers = await User.countDocuments({ ...filter, role: 'user' });

    // Get department breakdown
    const departmentStats = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get trade breakdown
    const tradeStats = await User.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$trade',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        summary: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          adminUsers,
          regularUsers
        },
        departmentStats,
        tradeStats
      }
    });

  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk Update Users (Admin only)
router.put('/bulk/update', adminAuth, async (req, res) => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Update data is required' });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const user = await User.findByIdAndUpdate(
          userId,
          updates,
          { new: true, runValidators: true }
        ).select('-password_hash');

        if (user) {
          results.push({ userId, status: 'updated', user });
        } else {
          errors.push({ userId, error: 'User not found' });
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    res.json({
      message: 'Bulk update completed',
      results,
      errors,
      summary: {
        successful: results.length,
        failed: errors.length,
        total: userIds.length
      }
    });

  } catch (error) {
    console.error('Bulk user update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search Users (Admin only)
router.get('/search/users', adminAuth, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { roll_no: { $regex: q, $options: 'i' } },
        { trade: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .select('-password_hash')
    .limit(parseInt(limit))
    .sort({ name: 1 });

    res.json({
      users,
      query: q,
      total: users.length
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
