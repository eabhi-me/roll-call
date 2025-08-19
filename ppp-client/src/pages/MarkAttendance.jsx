import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Users,
  CheckSquare,
  Square
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../services/api';

const MarkAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, scannedData } = location.state || {};
  
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  useEffect(() => {
    // Redirect if no user data
    if (!user) {
      toast.error('No user data found. Please scan a QR code first.');
      navigate('/scan');
      return;
    }

    // Fetch upcoming events
    fetchUpcomingEvents();
  }, [user, navigate]);

  const fetchUpcomingEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/events/upcoming`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      
      if (response.ok && result.events) {
        setEvents(result.events);
      } else {
        toast.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  };

  const markAttendance = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          eventId: selectedEvent,
          status: attendanceStatus
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setAttendanceMarked(true);
        toast.success('Attendance marked successfully!');
      } else {
        toast.error(result.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEvent('');
    setAttendanceStatus('present');
    setAttendanceMarked(false);
  };

  const goBackToScanner = () => {
    navigate('/scan');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No user data found.</p>
          <button
            onClick={() => navigate('/scan')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          
          <div className="w-20"></div>
        </motion.div>

        {!attendanceMarked ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* User Details Card */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Information</h2>
                  <p className="text-gray-600">Mark attendance for this student</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.name}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.roll_no}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trade/Department</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.trade}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {user.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Selection */}
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Select Event/Meeting
              </h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading events...</p>
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4">
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose an event or meeting...</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.title} - {event.event_type} ({event.date} at {event.time})
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="p-4 bg-blue-50 rounded-md">
                      <h4 className="font-semibold text-blue-900 mb-2">Selected Event Details:</h4>
                      {(() => {
                        const event = events.find(e => e._id === selectedEvent);
                        return event ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>{event.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <span>{event.date} at {event.time}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {event.event_type}
                              </span>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No upcoming events found</p>
                  <button
                    onClick={fetchUpcomingEvents}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh Events
                  </button>
                </div>
              )}
            </div>

            {/* Attendance Status */}
            {selectedEvent && (
              <div className="bg-white border border-gray-200 rounded-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Attendance Status</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value="present"
                      checked={attendanceStatus === 'present'}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      attendanceStatus === 'present' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {attendanceStatus === 'present' && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-gray-700">Present</span>
                  </label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value="absent"
                      checked={attendanceStatus === 'absent'}
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      attendanceStatus === 'absent' 
                        ? 'border-red-500 bg-red-500' 
                        : 'border-gray-300'
                    }`}>
                      {attendanceStatus === 'absent' && <XCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-gray-700">Absent</span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {selectedEvent && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ready to mark attendance</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Click the button below to mark {user.name} as {attendanceStatus} for the selected event.
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={markAttendance}
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Marking Attendance...' : 'Mark Attendance'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Success Message */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-md p-6 text-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Attendance Marked Successfully!
            </h3>
            
            <p className="text-gray-600 mb-6">
              {user.name} has been marked as {attendanceStatus} for the selected event.
            </p>

            <div className="flex space-x-4">
              <button
                onClick={goBackToScanner}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Scan Another QR
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
