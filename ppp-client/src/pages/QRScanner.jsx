import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = () => {
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const qrCodeRegionId = 'qr-reader';
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const startScanner = async () => {
      const config = { fps: 10, qrbox: 250 };

      try {
        html5QrCodeRef.current = new Html5Qrcode(qrCodeRegionId);
        setScanning(true);
        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            try {
              const jsonData = JSON.parse(decodedText);
              setScannedData(jsonData);
              console.log(jsonData);
            } catch (parseError) {
              setError('Scanned data is not valid JSON.');
            }
            stopScanner();
          },
          () => {}
        );
      } catch (err) {
        setError('Unable to start the QR scanner.');
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      setScanning(false);
    }
  };

  const closeModal = () => {
    setScannedData(null);
    setError(null);
    window.location.reload(); // reload to allow rescan
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        <h2 style={styles.heading}>Scan QR Code</h2>
        <div id={qrCodeRegionId} style={styles.qrBox} />
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.instructions}>Point your camera at a QR code with JSON data.</p>
      </div>

      {scannedData && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalHeading}>Scanned JSON Data</h3>
            <pre style={styles.jsonDisplay}>
              {JSON.stringify(scannedData, null, 2)}
            </pre>
            <button style={styles.closeButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f9f9f9',
  },
  container: {
    width: '90%',
    maxWidth: '400px',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    marginBottom: '20px',
    color: '#333',
  },
  qrBox: {
    width: '100%',
    height: '300px',
    marginBottom: '20px',
  },
  error: {
    color: 'red',
    fontSize: '14px',
    marginTop: '10px',
  },
  instructions: {
    fontSize: '14px',
    color: '#666',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    textAlign: 'left',
  },
  modalHeading: {
    marginBottom: '10px',
    color: '#333',
  },
  jsonDisplay: {
    backgroundColor: '#f0f0f0',
    padding: '15px',
    borderRadius: '6px',
    maxHeight: '300px',
    overflowY: 'auto',
    fontSize: '14px',
  },
  closeButton: {
    marginTop: '15px',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default QrScanner;
