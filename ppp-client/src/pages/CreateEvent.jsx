import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  QrCode, 
  LogOut,
  Plus,
  Save,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const CreateEvent = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [generatedEvent, setGeneratedEvent] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const eventTitle = watch('title');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate event data
      const eventData = {
        id: Date.now(),
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        duration: data.duration,
        location: data.location,
        maxAttendees: data.maxAttendees,
        department: data.department,
        qrCode: `EVENT_${Date.now()}_QR_CODE`,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };

      setGeneratedEvent(eventData);
      setShowQR(true);
      toast.success('Event created successfully!');
    } catch (error) {
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    toast.success('Logged out successfully');
  };

  const handleCreateAnother = () => {
    setShowQR(false);
    setGeneratedEvent(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showQR ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
              <p className="text-gray-600">Schedule a new TNP event and generate QR code for attendance</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Event Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Event Title *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...register('title', {
                        required: 'Event title is required',
                        minLength: {
                          value: 3,
                          message: 'Title must be at least 3 characters',
                        },
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter event title"
                    />
                  </div>
                  {errors.title && (
                    <p className="text-red-500 text-sm">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Enter event description (optional)"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="date"
                        {...register('date', {
                          required: 'Date is required',
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {errors.date && (
                      <p className="text-red-500 text-sm">{errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Start Time *</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="time"
                        {...register('time', {
                          required: 'Start time is required',
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {errors.time && (
                      <p className="text-red-500 text-sm">{errors.time.message}</p>
                    )}
                  </div>
                </div>

                {/* Duration and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Duration (hours) *</label>
                    <input
                      type="number"
                      {...register('duration', {
                        required: 'Duration is required',
                        min: {
                          value: 0.5,
                          message: 'Duration must be at least 0.5 hours',
                        },
                        max: {
                          value: 8,
                          message: 'Duration cannot exceed 8 hours',
                        },
                      })}
                      min="0.5"
                      max="8"
                      step="0.5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="2.5"
                    />
                    {errors.duration && (
                      <p className="text-red-500 text-sm">{errors.duration.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        {...register('location', {
                          required: 'Location is required',
                        })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter venue location"
                      />
                    </div>
                    {errors.location && (
                      <p className="text-red-500 text-sm">{errors.location.message}</p>
                    )}
                  </div>
                </div>

                {/* Max Attendees and Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Maximum Attendees *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        {...register('maxAttendees', {
                          required: 'Maximum attendees is required',
                          min: {
                            value: 1,
                            message: 'Must allow at least 1 attendee',
                          },
                          max: {
                            value: 500,
                            message: 'Cannot exceed 500 attendees',
                          },
                        })}
                        min="1"
                        max="500"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="100"
                      />
                    </div>
                    {errors.maxAttendees && (
                      <p className="text-red-500 text-sm">{errors.maxAttendees.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Target Department</label>
                    <select
                      {...register('department')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                      <option value="">All Departments</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                      <option value="Chemical">Chemical</option>
                      <option value="TNP">TNP</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Event...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Event & Generate QR
                    </div>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {/* Success Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Created Successfully!</h1>
              <p className="text-gray-600">Your QR code is ready for attendance tracking</p>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Info */}
                <div className="text-left">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Event Title</p>
                      <p className="text-gray-900">{generatedEvent.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date & Time</p>
                      <p className="text-gray-900">{generatedEvent.date} at {generatedEvent.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Duration</p>
                      <p className="text-gray-900">{generatedEvent.duration} hours</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Location</p>
                      <p className="text-gray-900">{generatedEvent.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Max Attendees</p>
                      <p className="text-gray-900">{generatedEvent.maxAttendees} students</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Event ID</p>
                      <p className="text-gray-900 font-mono">{generatedEvent.id}</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <QRCodeSVG
                      value={generatedEvent.qrCode}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3">Scan this QR code to mark attendance</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCreateAnother}
                className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Another Event
              </button>
              <Link
                to="/admin"
                className="flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
