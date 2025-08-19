import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  password_hash: {
    type: String,
    required: true
  },
  trade: {
    type: String,
    required: true,
    trim: true,
    default: 'TNP'
  },
  roll_no: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  department: {
    type: String,
    required: false,
    trim: true,
    default: function() {
      return this.trade || 'TNP';
    }
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  qr_code_data: {
    type: String,
    unique: true,
    sparse: true
  },
  qr_code_url: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.index({ role: 1 });
userSchema.index({ trade: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model('User', userSchema);
export default User;
