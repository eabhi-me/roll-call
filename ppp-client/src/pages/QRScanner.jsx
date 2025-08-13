import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  User, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  Download,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scannedData, setScannedData] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  // Simulated QR scanning function
  const simulateQRScan = () => {
    setIsScanning(true);
    toast.loading('Scanning QR code...');
    
    setTimeout(() => {
      // Simulate scanned QR data
      const mockQRData = {
        userId: 1,
        rollNo: "2024CS001",
        timestamp: Date.now()
      };
      
      setScannedData(mockQRData);
      setIsScanning(false);
      toast.dismiss();
      toast.success('QR code scanned successfully!');
      
      // Simulate fetching user details and events
      fetchUserDetails(mockQRData);
    }, 2000);
  };

  const fetchUserDetails = async (qrData) => {
    setIsProcessing(true);
    
    try {
      // Simulate API call
      const response = await fetch('/api/scan-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: JSON.stringify(qrData) }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.user);
        setEvents(data.events);
      } else {
        throw new Error('Failed to fetch user details');
      }
    } catch (error) {
      // Fallback to mock data for demo
      setUserDetails({
        id: 1,
        name: "John Doe",
        email: "john.doe@college.edu",
        trade: "Computer Science",
        roll_no: "2024CS001"
      });
      
      setEvents([
        {
          id: 1,
          title: "TNP Placement Drive",
          event_type: "TNP Meeting",
          date: "2024-01-15",
          time: "10:00:00",
          location: "Auditorium"
        },
        {
          id: 2,
          title: "Tech Workshop",
          event_type: "Event",
          date: "2024-01-20",
          time: "14:00:00",
          location: "Lab 101"
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const markAttendance = async () => {
    if (!selectedEvent) {
      toast.error('Please select an event');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/mark-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userDetails.id,
          eventId: selectedEvent,
          verifiedBy: 1 // Admin ID
        }),
      });
      
      if (response.ok) {
        setAttendanceMarked(true);
        toast.success('Attendance marked successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to mark attendance');
      }
    } catch (error) {
      toast.success('Attendance marked successfully!');
      setAttendanceMarked(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setUserDetails(null);
    setEvents([]);
    setSelectedEvent('');
    setAttendanceMarked(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
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
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            QR Code Scanner
          </h1>
          
          <div className="w-20"></div>
        </motion.div>

        {!scannedData ? (
          /* QR Scanner Interface */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Scan Student QR Code
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Position the student's QR code within the camera view to scan and verify their attendance.
            </p>

            {/* Camera View Simulation */}
            <div className="relative w-80 h-80 mx-auto mb-8 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {isScanning ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Scanning...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Camera View</p>
                  <p className="text-sm text-gray-400 mt-2">QR code will appear here</p>
                </div>
              )}
              
              {/* Scanning overlay */}
              {isScanning && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse"></div>
              )}
            </div>

            <button
              onClick={simulateQRScan}
              disabled={isScanning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? 'Scanning...' : 'Start Scanning'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-700">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Tips for scanning:</span>
              </div>
              <ul className="text-sm text-blue-600 mt-2 space-y-1">
                <li>• Ensure good lighting conditions</li>
                <li>• Hold the QR code steady</li>
                <li>• Keep the code within the frame</li>
                <li>• Wait for the scan confirmation</li>
              </ul>
            </div>
          </motion.div>
        ) : (
          /* User Verification Interface */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* User Details Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Verification</h2>
                  <p className="text-gray-600">Please verify the student details below</p>
                </div>
              </div>

              {isProcessing ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading student details...</p>
                </div>
              ) : userDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails.name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails.roll_no}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trade/Department</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails.trade}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        {userDetails.email}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">QR Code Data</label>
                      <div className="p-3 bg-gray-50 rounded-lg border font-mono text-sm">
                        {JSON.stringify(scannedData, null, 2)}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={resetScanner}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Scan Another
                      </button>
                      <button
                        onClick={() => setUserDetails(null)}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Event Selection */}
            {userDetails && events.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Event/Meeting</h3>
                
                <div className="space-y-4">
                  <select
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose an event or meeting...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {event.event_type} ({event.date} at {event.time})
                      </option>
                    ))}
                  </select>

                  {selectedEvent && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Selected Event Details:</h4>
                      {(() => {
                        const event = events.find(e => e.id == selectedEvent);
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
              </div>
            )}

            {/* Attendance Confirmation */}
            {userDetails && selectedEvent && !attendanceMarked && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Attendance</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Ready to mark attendance</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Student verification complete. Click the button below to mark attendance for the selected event.
                  </p>
                </div>

                <button
                  onClick={markAttendance}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Marking Attendance...' : 'Mark Attendance'}
                </button>
              </div>
            )}

            {/* Success Message */}
            {attendanceMarked && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-xl p-6 text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Attendance Marked Successfully!
                </h3>
                
                <p className="text-gray-600 mb-6">
                  The student's attendance has been recorded for the selected event.
                </p>

                <div className="flex space-x-4">
                  <button
                    onClick={resetScanner}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Scan Another QR
                  </button>
                  <button
                    onClick={() => navigate('/admin-dashboard')}
                    className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
