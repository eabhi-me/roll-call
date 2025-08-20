import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  Smartphone,
  Scan,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../services/api';
import jsQR from 'jsqr';
import { QrReader } from 'react-qr-reader';

const QRScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [scannedData, setScannedData] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [scanningStatus, setScanningStatus] = useState('idle'); // idle, scanning, detected
  const [scannedQRData, setScannedQRData] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [framesScanned, setFramesScanned] = useState(0);
  const [lastDetectionAt, setLastDetectionAt] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [constraintsUsed, setConstraintsUsed] = useState(null);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [manualQrInput, setManualQrInput] = useState('');
  const [qrReaderActive, setQrReaderActive] = useState(true);
  // Inline attendance marking
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('present');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Improved camera and QR detection implementation

// Start camera with better error handling and state management
const startCamera = async () => {
  try {
    setCameraError(null);
    setIsScanning(true);
    setScanningStatus('scanning');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not available in this browser or insecure context');
    }

    // Stop any existing stream first
    stopCamera();
    
    const stream = await getMediaStream();
    streamRef.current = stream;
    
    if (videoRef.current) {
      setupVideoElement(stream);
      setIsCameraActive(true);
      
      // Wait for video to be ready before starting detection
      await waitForVideoReady();
      startQRDetection();
    }
    
    // Refresh available cameras after getting stream
    await refreshDevices();
    
  } catch (error) {
    console.error('Camera error:', error);
    handleCameraError(error);
  }
};

// Simplified media stream acquisition with progressive fallback
const getMediaStream = async () => {
  const constraints = [
    // Try selected camera first
    selectedCameraId && {
      video: {
        deviceId: { exact: selectedCameraId },
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        aspectRatio: { ideal: 16 / 9 }
      }
    },
    // Environment camera with high quality
    {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        aspectRatio: { ideal: 16 / 9 }
      }
    },
    // Basic environment camera
    { video: { facingMode: { ideal: 'environment' } } },
    // Front camera fallback
    { video: { facingMode: { ideal: 'user' } } },
    // Generic video
    { video: true }
  ].filter(Boolean);

  let lastError;
  for (const constraint of constraints) {
    try {
      setConstraintsUsed(constraint);
      const stream = await navigator.mediaDevices.getUserMedia({video:true});
      return stream;
    } catch (error) {
      lastError = error;
      console.log(`Constraint failed:`, constraint, error.message);
    }
  }
  
  throw lastError || new Error('Failed to get media stream');
};

// Setup video element with proper attributes and event handlers
const setupVideoElement = (stream) => {
  const video = videoRef.current;
  
  // Set video attributes for mobile compatibility
  video.setAttribute('playsinline', 'true');
  video.setAttribute('webkit-playsinline', 'true');
  video.setAttribute('muted', 'true');
  video.setAttribute('autoplay', 'true');
  video.muted = true;
  video.srcObject = stream;

  // Setup event handlers
  video.addEventListener('loadeddata', handleVideoLoadedData, { once: true });
  video.addEventListener('playing', () => setScanningStatus('scanning'), { once: true });
  video.addEventListener('error', handleVideoError);
};

// Wait for video to be ready with timeout
const waitForVideoReady = () => {
  return new Promise((resolve, reject) => {
    const video = videoRef.current;
    
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      resolve();
      return;
    }
    
    const checkReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoSize({ width: video.videoWidth, height: video.videoHeight });
        resolve();
      }
    };
    
    video.addEventListener('loadeddata', checkReady, { once: true });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      video.removeEventListener('loadeddata', checkReady);
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        reject(new Error('Camera did not start - no video frames received'));
      }
    }, 5000);
  });
};

// Handle video element events
const handleVideoLoadedData = async () => {
  try {
    await videoRef.current.play();
    setVideoSize({ 
      width: videoRef.current.videoWidth, 
      height: videoRef.current.videoHeight 
    });
  } catch (playError) {
    console.error('Video play error:', playError);
    throw playError;
  }
};

const handleVideoError = (e) => {
  console.error('Video element error:', e);
  const error = new Error('Video element error - try switching camera or reloading');
  handleCameraError(error);
};

// Refresh available cameras
const refreshDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');
    setAvailableCameras(cameras);
    
    // Auto-select environment camera if none selected
    if (!selectedCameraId && cameras.length > 0) {
      const environmentCam = cameras.find(c => 
        /back|rear|environment/i.test(c.label)
      );
      setSelectedCameraId((environmentCam || cameras[0]).deviceId);
    }
    
    if (cameras.length === 0) {
      setLastError('No cameras detected after permission granted');
    }
  } catch (error) {
    console.warn('Failed to enumerate devices:', error);
  }
};

// Improved error handling
const handleCameraError = (error) => {
  setCameraError(error.message);
  setLastError(error.message);
  setIsScanning(false);
  setScanningStatus('idle');
  
  // Show appropriate toast messages
  const errorMessages = {
    'NotAllowedError': 'Camera access denied. Please allow camera permissions.',
    'NotFoundError': 'No camera found on this device.',
    'NotSupportedError': 'Camera not supported on this device.',
    'NotReadableError': 'Camera is already in use by another application.',
    'OverconstrainedError': 'Camera constraints not supported.'
  };
  
  const message = errorMessages[error.name] || 'Failed to start camera. Please try again.';
  toast.error(message);
};

// Stop camera with proper cleanup
const stopCamera = () => {
  // Stop media stream
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  
  // Clean up video element
  if (videoRef.current) {
    const video = videoRef.current;
    video.removeEventListener('loadeddata', handleVideoLoadedData);
    video.removeEventListener('playing', () => setScanningStatus('scanning'));
    video.removeEventListener('error', handleVideoError);
    
    try {
      video.pause();
      video.srcObject = null;
    } catch (error) {
      console.warn('Error cleaning up video element:', error);
    }
  }
  
  // Stop detection loop
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }
  
  // Reset states
  setIsCameraActive(false);
  setIsScanning(false);
  setScanningStatus('idle');
};

// Improved QR detection with better performance
const startQRDetection = () => {
  let frameCount = 0;
  const DETECTION_INTERVAL = 3; // Process every 3rd frame for performance
  
  const detectQR = () => {
    // Check if we should continue scanning
    if (!isCameraActive || !videoRef.current || !canvasRef.current || !streamRef.current) {
      return;
    }
    
    frameCount++;
    
    // Skip frames for performance (process every nth frame)
    if (frameCount % DETECTION_INTERVAL !== 0) {
      animationFrameRef.current = requestAnimationFrame(detectQR);
      return;
    }
    
    try {
      const code = processVideoFrame();
      
      if (code) {
        console.log('QR Code detected:', code.data);
        setLastDetectionAt(new Date().toISOString());
        handleQRDetected(code.data);
        return; // Stop scanning after detection
      }
      
      setFramesScanned(prev => prev + 1);
      
      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(detectQR);
      
    } catch (error) {
      console.error('QR detection error:', error);
      // Continue scanning despite errors
      animationFrameRef.current = requestAnimationFrame(detectQR);
    }
  };
  
  detectQR();
};

// Process single video frame for QR detection
const processVideoFrame = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  
  // Update canvas size if video dimensions changed
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    if (debugEnabled) {
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
      setCanvasSize({ width: canvas.width, height: canvas.height });
    }
  }
  
  // Draw current video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Get image data for QR detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Detect QR code
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });
};

// Handle QR code detection with debouncing
const handleQRDetected = (qrData) => {
  console.log('QR Code detected, processing:', qrData);
  
  const now = Date.now();
  const DEBOUNCE_TIME = 2000;
  
  if (lastScanTime && now - lastScanTime < DEBOUNCE_TIME) {
    console.log('Scan too recent, ignoring');
    return;
  }
  
  setLastScanTime(now);
  setScanAttempts(prev => prev + 1);
  setScanningStatus('detected');
  
  // Process the QR data
  processQRData(qrData);
};

// Utility function to check if camera is supported
const isCameraSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};


  
  const processQRData = async (qrData) => {
    console.log('Processing QR data:', qrData);
    setIsProcessing(true);
    toast.loading('Processing QR code...');
    
    try {
      let parsedData;
      
      
      try {
        parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        console.log('Parsed QR data:', parsedData);
      } catch (parseError) {
        console.log('Failed to parse as JSON, treating as string:', parseError);
        // If parsing fails, treat as simple string data
        parsedData = {
          userId: qrData,
          rollNo: qrData,
          timestamp: Date.now(),
          type: "user_attendance"
        };
      }

      
      if (!parsedData.userId && !parsedData.rollNo) {
        throw new Error('Invalid QR code format - missing user ID or roll number');
      }
      
      setScannedData(parsedData);
      setScannedQRData(JSON.stringify(parsedData, null, 2));
      
      console.log('Sending QR data to backend:', parsedData);
      
      // Fetch user details from backend
      const response = await fetch(`${API_BASE_URL}/qr/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ qrData: JSON.stringify(parsedData) })
      });

      const result = await response.json();
      console.log('Backend response:', result);
      
      if (response.ok && result.user) {
        setUserDetails(result.user);
        toast.dismiss();
        toast.success('QR code scanned successfully!');
        stopCamera();
      } else {
        toast.dismiss();
        toast.error(result.error || 'Failed to process QR code');
        console.error('Backend error:', result.error);
      }
    } catch (error) {
      console.error('QR processing error:', error);
      toast.dismiss();
      toast.error(`Failed to process QR code: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual QR input (fallback)
  const handleManualQRInput = () => {
    const qrData = prompt('Enter QR code data manually:');
    if (qrData) {
      processQRData(qrData);
    }
  };

  // Simulate QR scan (for testing)
  const simulateQRScan = () => {
    const mockQRData = {
      userId: "507f1f77bcf86cd799439011", // Mock MongoDB ObjectId
      rollNo: "2024CS001",
      name: "John Doe",
      trade: "Computer Science",
      timestamp: Date.now(),
      type: "user_attendance"
    };
    processQRData(mockQRData);
  };

  // Navigate to attendance marking page
  const goToAttendanceMarking = () => {
    if (userDetails) {
      // Navigate to attendance marking page with user data
      navigate('/mark-attendance', { 
        state: { 
          user: userDetails,
          scannedData: scannedData 
        } 
      });
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScannedData(null);
    setUserDetails(null);
    setScannedQRData('');
    setScanAttempts(0);
    setLastScanTime(null);
    setCameraError(null);
    setScanningStatus('idle');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // If user changes camera selection while active, restart stream with new device
  useEffect(() => {
    if (isCameraActive && selectedCameraId) {
      stopCamera();
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCameraId]);

  // Fetch active events once student details are available
  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        let resp = await fetch(`${API_BASE_URL}/events/active`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        let data = await resp.json();
        if (!resp.ok || !Array.isArray(data.events)) {
          // Fallback to upcoming if active not available
          resp = await fetch(`${API_BASE_URL}/events/upcoming`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          data = await resp.json();
        }
        if (Array.isArray(data.events)) setEvents(data.events);
      } catch (e) {
        // ignore
      }
    };
    if (userDetails) {
      fetchActiveEvents();
    }
  }, [userDetails]);

  const markAttendance = async () => {
    if (!userDetails || !selectedEvent) {
      toast.error(!selectedEvent ? 'Please select an event' : 'No user to mark');
      return;
    }
    setIsSubmitting(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: userDetails._id || userDetails.id,
          eventId: selectedEvent,
          status: attendanceStatus
        })
      });
      const result = await resp.json();
      if (resp.ok) {
        toast.success('Attendance marked successfully');
      } else {
        toast.error(result.error || 'Failed to mark attendance');
      }
    } catch (err) {
      toast.error('Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
          
          <div className="w-20"></div>
        </motion.div>

        {!scannedData ? (
          /* QR Scanner Interface */
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-md p-6 text-center"
          >
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scan className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Scan Student QR Code
            </h2>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Position the student's QR code within the camera view to scan and verify their attendance.
            </p>

            {/* Camera View (react-qr-reader) */}
            <div className="relative w-full max-w-3xl mx-auto mb-8 rounded-xl overflow-hidden bg-black h-[60vh] sm:h-[70vh]">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <WifiOff className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-red-600 text-sm mb-2">Camera Error</p>
                  <p className="text-gray-500 text-xs text-center">{cameraError}</p>
                </div>
              ) : qrReaderActive ? (
                <>
                  <QrReader
                    constraints={{ facingMode: 'environment' }}
                    scanDelay={250}
                    onResult={(result, error) => {
                      if (result) {
                        const text = result?.text || (result?.getText && result.getText()) || '';
                        const now = Date.now();
                        if (text && now - (lastDetectionAt ? Date.parse(lastDetectionAt) : 0) > 1500) {
                          setLastDetectionAt(new Date().toISOString());
                          processQRData(text);
                        }
                      }
                    }}
                    containerStyle={{ width: '100%', height: '100%' }}
                    videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Overlay */}
                  <div className="pointer-events-none absolute inset-0 border-2 border-blue-500 rounded-lg">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-md"></div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white text-sm">Camera paused</div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex flex-col items-center space-y-3 mb-6">
              {!qrReaderActive ? (
                <button
                  onClick={() => setQrReaderActive(true)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Resume Camera</span>
                </button>
              ) : (
                <button
                  onClick={() => setQrReaderActive(false)}
                  className="bg-red-600 text-white px-8 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Pause Camera</span>
                </button>
              )}
              {availableCameras.length > 1 && (
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Camera:</label>
                  <select
                    value={selectedCameraId || ''}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {availableCameras.map(cam => (
                      <option key={cam.deviceId} value={cam.deviceId}>{cam.label || 'Camera'}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {debugEnabled && (
              <div className="mb-6 p-4 bg-gray-100 rounded-md text-left text-xs text-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-semibold">Media API:</span> {navigator.mediaDevices ? 'available' : 'missing'}</div>
                  <div><span className="font-semibold">Frames scanned:</span> {framesScanned}</div>
                  <div><span className="font-semibold">Video size:</span> {videoSize.width}x{videoSize.height}</div>
                  <div><span className="font-semibold">Canvas size:</span> {canvasSize.width}x{canvasSize.height}</div>
                  <div><span className="font-semibold">Cameras detected:</span> {availableCameras.length}</div>
                  <div><span className="font-semibold">Selected camera:</span> {availableCameras.find(c=>c.deviceId===selectedCameraId)?.label || 'auto'}</div>
                  <div className="col-span-2"><span className="font-semibold">Last detection:</span> {lastDetectionAt || '—'}</div>
                  <div className="col-span-2"><span className="font-semibold">Last error:</span> {lastError || '—'}</div>
                  <div className="col-span-2 overflow-auto"><span className="font-semibold">Constraints:</span> <pre className="whitespace-pre-wrap break-words">{constraintsUsed ? JSON.stringify(constraintsUsed) : '—'}</pre></div>
                </div>
              </div>
            )}

            {/* Manual QR input */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="text-left mb-2 text-sm font-medium text-gray-700">Manual QR Input (fallback)</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualQrInput.trim()) {
                    processQRData(manualQrInput.trim());
                  }
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  placeholder='Paste QR data (JSON or roll no/user id)'
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !manualQrInput.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm disabled:opacity-50"
                >
                  Process
                </button>
              </form>
              <div className="mt-1 text-xs text-gray-500 text-left">For testing or when the camera isn’t available.</div>
            </div>
            {/* Scanning Stats */}
            {scanAttempts > 0 && (
              <div className="mb-6 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Scan attempts: {scanAttempts}
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="p-4 bg-blue-50 rounded-md">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Tips for scanning:</span>
              </div>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Ensure good lighting conditions</li>
                <li>• Hold the QR code steady within the frame</li>
                <li>• Keep the code at a reasonable distance</li>
                <li>• Wait for the scan confirmation</li>
                <li>• Use the test scan button for development</li>
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
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
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
                    <div className="flex space-x-3">
                      <button
                        onClick={resetScanner}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Scan Another</span>
                      </button>
                      <button
                        onClick={() => setUserDetails(null)}
                        className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">QR Code scanned but user not found</p>
                  <div className="bg-gray-100 p-4 rounded-md text-left">
                    <p className="text-sm text-gray-700 mb-2">Scanned QR Data:</p>
                    <pre className="text-xs text-gray-600 overflow-x-auto">{scannedQRData}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Inline Event Selection & Marking */}
            {userDetails && (
              <div className="bg-white border border-gray-200 rounded-md p-6 space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Student verified successfully!</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Select an event and status to mark attendance.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose an event…</option>
                      {events.map((ev) => (
                        <option key={ev._id || ev.id} value={ev._id || ev.id}>
                          {ev.title} — {ev.date} {ev.time}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Attendance Status</label>
                      <div className="flex items-center gap-6">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="attendanceStatus"
                            value="present"
                            checked={attendanceStatus === 'present'}
                            onChange={(e) => setAttendanceStatus(e.target.value)}
                          />
                          <span>Present</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="attendanceStatus"
                            value="absent"
                            checked={attendanceStatus === 'absent'}
                            onChange={(e) => setAttendanceStatus(e.target.value)}
                          />
                          <span>Absent</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={markAttendance}
                    disabled={!selectedEvent || isSubmitting}
                    className="flex-1 bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Marking…' : 'Mark Attendance'}
                  </button>
                  <button
                    onClick={resetScanner}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Scan Another
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
