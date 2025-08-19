import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  event_type: {
    type: String,
    enum: ['Event', 'TNP Meeting'],
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  attendee_count: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

eventSchema.methods.updateAttendeeCount = async function() {
  const Attendance = mongoose.model('Attendance');
  const presentCount = await Attendance.countDocuments({
    event_id: this._id,
    status: 'present'
  });
  this.attendee_count = presentCount;
  return this.save();
};

eventSchema.index({ date: 1 });
eventSchema.index({ event_type: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ isActive: 1 });
eventSchema.index({ 'createdAt': -1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
