import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Snapshot of admin details at the time of verification (denormalized for history)
  verified_by_snapshot: {
    name: { type: String },
    email: { type: String }
  }
}, {
  timestamps: true
});

// Method to mark attendance
attendanceSchema.methods.markAttendance = function(status, verifiedBy) {
  this.status = status;
  this.verified_by = verifiedBy;
  return this.save();
};

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function(filters = {}) {
  const pipeline = [
    { $match: { ...filters } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  const result = { present: 0, absent: 0, total: 0 };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

// Compound unique index to prevent duplicate attendance records
attendanceSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

// Additional indexes for better performance
attendanceSchema.index({ event_id: 1 });
attendanceSchema.index({ user_id: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ verified_by: 1 });
attendanceSchema.index({ 'createdAt': -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
