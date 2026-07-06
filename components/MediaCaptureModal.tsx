import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Video, Mic, ScanLine, X, Play, Square, Circle, Check, RefreshCw, Volume2 } from 'lucide-react';
import { Theme } from '../theme';

interface MediaCaptureModalProps {
  mode: 'photo' | 'video' | 'audio' | 'barcode';
  onClose: () => void;
  onSaveAttachment: (blob: Blob, name: string, type: string, extraContent?: string) => void;
  theme: Theme;
}

export const MediaCaptureModal: React.FC<MediaCaptureModalProps> = ({
  mode,
  onClose,
  onSaveAttachment,
  theme,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [barcodeSimType, setBarcodeSimType] = useState<'UPC-A' | 'EAN-13' | 'ISBN' | 'Custom'>('UPC-A');
  const [customBarcodeText, setCustomBarcodeText] = useState('012345678905');
  const [scannedPayload, setScannedPayload] = useState<{
    value: string;
    type: string;
    isValid: boolean;
    warning?: string;
    timestamp: number;
  } | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [manualType, setManualType] = useState<string>('UPC-A');
  const [showManualForm, setShowManualForm] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Attachment size limit check: 300 MB
  const MAX_SIZE_MB = 300;

  useEffect(() => {
    startMedia();
    return () => {
      stopMedia();
    };
  }, [mode]);

  const startMedia = async () => {
    setErrorMessage(null);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setTimer(0);
    stopMedia();

    try {
      let constraints: MediaStreamConstraints = {};
      if (mode === 'photo' || mode === 'barcode') {
        constraints = { video: { facingMode: 'environment' } };
      } else if (mode === 'video') {
        constraints = { video: true, audio: true };
      } else if (mode === 'audio') {
        constraints = { audio: true };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current && (mode === 'photo' || mode === 'video' || mode === 'barcode')) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => console.log('Video play error:', err));
      }

      if (mode === 'audio') {
        setupAudioVisualizer(mediaStream);
      }

      if (mode === 'barcode') {
        startBarcodeScanTracking();
      }
    } catch (err: any) {
      console.error('Media permission failed:', err);
      setErrorMessage(`Camera or microphone access was denied or is unavailable. (${err.message})`);
    }
  };

  const stopMedia = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const handleBarcodeDetected = (value: string, type: string) => {
    let isValid = true;
    let warning: string | undefined = undefined;

    const trimmed = value.trim();
    if (type === 'UPC-A') {
      if (!/^\d+$/.test(trimmed)) {
        isValid = false;
        warning = 'UPC-A retail codes must contain only numeric digits.';
      } else if (trimmed.length !== 12) {
        isValid = false;
        warning = `UPC-A retail codes require exactly 12 digits (found ${trimmed.length}).`;
      }
    } else if (type === 'EAN-13') {
      if (!/^\d+$/.test(trimmed)) {
        isValid = false;
        warning = 'EAN-13 supermarket codes must contain only numeric digits.';
      } else if (trimmed.length !== 13) {
        isValid = false;
        warning = `EAN-13 supermarket codes require exactly 13 digits (found ${trimmed.length}).`;
      }
    } else if (type === 'ISBN') {
      if (!/^\d+$/.test(trimmed)) {
        isValid = false;
        warning = 'ISBN book codes must contain only numeric digits.';
      } else if (trimmed.length !== 10 && trimmed.length !== 13) {
        isValid = false;
        warning = `ISBN book codes require exactly 10 or 13 digits (found ${trimmed.length}).`;
      }
    } else {
      if (!trimmed) {
        isValid = false;
        warning = 'Scanned payload cannot be completely empty.';
      }
    }

    setScannedPayload({
      value: trimmed,
      type,
      isValid,
      warning,
      timestamp: Date.now()
    });

    stopMedia();
  };

  // Real-time Barcode Tracking simulation or actual Web API Barcode Detection
  const [barcodeStatus, setBarcodeStatus] = useState<string>('Scanning for barcode...');
  const startBarcodeScanTracking = () => {
    let checkCount = 0;
    const scanInterval = setInterval(() => {
      checkCount++;
      if (checkCount === 4) {
        setBarcodeStatus('Optimizing image contrast...');
      }
      if (checkCount === 8) {
        setBarcodeStatus('Awaiting focus alignment...');
      }
    }, 1000);

    // Setup BarcodeDetector loop if supported natively in user browser
    if ('BarcodeDetector' in window) {
      console.log('Native BarcodeDetector detected. Setting up real-time stream decoding...');
      const scanFrame = async () => {
        if (!videoRef.current || !stream || mode !== 'barcode') return;
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'upc_a', 'code_128', 'code_39', 'itf']
          });
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0];
            clearInterval(scanInterval);
            let friendlyFormat = 'Custom';
            if (code.format === 'upc_a') friendlyFormat = 'UPC-A';
            else if (code.format === 'ean_13') friendlyFormat = 'EAN-13';
            else if (code.format === 'qr_code') friendlyFormat = 'QR Code';
            
            handleBarcodeDetected(code.rawValue, friendlyFormat);
            return;
          }
        } catch (e) {
          // Silent catch
        }
        
        if (mode === 'barcode') {
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        }
      };
      
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }, 800);
    }

    return () => clearInterval(scanInterval);
  };

  // Audio wave visualization on Canvas
  const setupAudioVisualizer = (audioStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(audioStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        if (!analyserRef.current) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 1.5;

          // Glowing neon bar design
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#f59e0b'); // amber-500
          gradient.addColorStop(1, '#ef4444'); // red-500

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      };

      draw();
    } catch (e) {
      console.warn('Audio Context Visualizer failed to initialize:', e);
    }
  };

  // Recording timer tracker
  const startTimer = () => {
    setTimer(0);
    timerIntervalRef.current = window.setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Photo Capture
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stopMedia();
      }
    }, 'image/jpeg');
  };

  // Video / Audio Recording Controls
  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    
    // Choose compatible mimeType
    let options = { mimeType: 'video/webm;codecs=vp9,opus' };
    if (mode === 'audio') {
      options = { mimeType: 'audio/webm' };
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: '' };
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: mode === 'video' ? 'video/webm' : 'audio/webm',
        });

        // Double check maximum limit
        const sizeMB = finalBlob.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) {
          alert(`⚠️ Saved recording exceeds maximum size limit of ${MAX_SIZE_MB} MB!`);
          setRecordedBlob(null);
          setRecordedUrl(null);
        } else {
          setRecordedBlob(finalBlob);
          setRecordedUrl(URL.createObjectURL(finalBlob));
        }
        stopMedia();
      };

      mediaRecorder.start(1000); // chunk every second
      setRecording(true);
      startTimer();
    } catch (e: any) {
      alert(`Could not start media recording: ${e.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      stopTimer();
    }
  };

  // Barcode Decoding Scanner Trigger
  const triggerBarcodeScan = () => {
    let value = '';
    if (barcodeSimType === 'UPC-A') {
      value = '012345678905';
    } else if (barcodeSimType === 'EAN-13') {
      value = '5012345678900';
    } else if (barcodeSimType === 'ISBN') {
      value = '9780134685991';
    } else {
      value = customBarcodeText.trim() || '735999011112';
    }
    handleBarcodeDetected(value, barcodeSimType);
  };

  // Save Confirmed Barcode Attachment
  const handleSaveBarcodeConfirmation = () => {
    if (!scannedPayload) return;
    const { value, type, isValid, warning, timestamp } = scannedPayload;
    
    const name = type === 'UPC-A' ? 'UPC-A Retail Barcode' : type === 'EAN-13' ? 'EAN-13 Supermarket Item' : type === 'ISBN' ? 'ISBN Book' : type;
    const validityStr = isValid ? 'PASS (Valid payload format)' : 'FAIL (Invalid payload format - saved as raw text)';
    const warningStr = warning ? `\nWarning: ${warning}` : '';
    
    const message = `Decoded ${type}: [${value}]\nType: ${name}\nTime: ${new Date(timestamp).toLocaleString()}\nValidation Status: ${validityStr}${warningStr}`;
    
    const fileContentBlob = new Blob([message], { type: 'text/plain' });
    onSaveAttachment(fileContentBlob, `scanned_barcode_${Date.now()}.txt`, 'text/plain', message);
    onClose();
  };

  // Save Confirmed Attachment Action
  const handleConfirmSave = () => {
    if (!recordedBlob) return;

    let filename = `media_clip_${Date.now()}`;
    let mimeType = recordedBlob.type;

    if (mode === 'photo') {
      filename = `photo_${Date.now()}.jpg`;
      mimeType = 'image/jpeg';
    } else if (mode === 'video') {
      filename = `video_${Date.now()}.webm`;
      mimeType = 'video/webm';
    } else if (mode === 'audio') {
      filename = `audio_${Date.now()}.webm`;
      mimeType = 'audio/webm';
    }

    onSaveAttachment(recordedBlob, filename, mimeType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${theme.modalBg} border ${theme.border} rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme.border} flex items-center justify-between flex-shrink-0`}>
          <div className="flex items-center gap-2">
            {mode === 'photo' && <Camera className="w-5 h-5 text-amber-500" />}
            {mode === 'video' && <Video className="w-5 h-5 text-rose-500" />}
            {mode === 'audio' && <Mic className="w-5 h-5 text-emerald-500" />}
            {mode === 'barcode' && <ScanLine className="w-5 h-5 text-sky-500" />}
            <span className={`text-base font-black uppercase tracking-wider ${theme.text}`}>
              {mode === 'photo' && 'Capture Photo'}
              {mode === 'video' && 'Record Video'}
              {mode === 'audio' && 'Record Audio Clip'}
              {mode === 'barcode' && 'Barcode / QR Scanner'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-500/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          {errorMessage ? (
            <div className="text-center p-4 space-y-6 w-full max-w-sm flex flex-col items-center">
              <div className="space-y-2">
                <span className="text-3xl">📷</span>
                <p className="text-sm text-rose-400 font-black uppercase tracking-wider">Camera Scan Unavailable</p>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {mode === 'barcode' 
                    ? "Camera permission was denied, or camera hardware is currently unavailable. To scan barcodes or QR codes natively, please allow camera access. You can also use the manual entry fallback below:" 
                    : errorMessage}
                </p>
              </div>

              {mode === 'barcode' ? (
                <div className={`p-4 rounded-xl bg-slate-900/60 border ${theme.border} text-left space-y-3 w-full`}>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-l-2 border-orange-500 pl-2">Manual Barcode Entry</p>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Code Format Type</label>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg outline-none text-xs font-semibold`}
                    >
                      <option value="UPC-A">UPC-A (Retail Item)</option>
                      <option value="EAN-13">EAN-13 (Supermarket Product)</option>
                      <option value="ISBN">ISBN (Book/Textbook)</option>
                      <option value="QR Code">QR Code</option>
                      <option value="Custom">Custom / Code 128</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Raw Payload Value</label>
                    <input
                      type="text"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      placeholder={manualType === 'UPC-A' ? 'e.g. 012345678905' : manualType === 'EAN-13' ? 'e.g. 5012345678900' : 'Enter barcode digits...'}
                      className={`w-full px-3 py-2 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg outline-none text-xs font-mono font-bold`}
                    />
                  </div>

                  <button
                    onClick={() => handleBarcodeDetected(manualValue, manualType)}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md mt-2"
                  >
                    Confirm Manual Entry
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startMedia} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider ${theme.accentBg} text-black`}
                >
                  Retry Camera / Mic
                </button>
              )}
            </div>
          ) : (
            <div className="w-full relative flex flex-col items-center">
              
              {/* Media Previews & Canvas Controls */}
              <AnimatePresence mode="wait">
                {mode === 'barcode' ? (
                  scannedPayload ? (
                    // Confirmation Preview Screen
                    <motion.div
                      key="barcode-confirmation"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      
                      <div className="text-center">
                        <h4 className={`text-sm font-black uppercase tracking-wider ${theme.text}`}>Confirmation Preview</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Please verify the decoded barcode details</p>
                      </div>

                      <div className="w-full p-4.5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-3 font-medium">
                        <div className="grid grid-cols-2 gap-3 text-xs border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Decoded Value</span>
                            <span className={`font-mono font-black ${theme.text} break-all text-sm`}>
                              {scannedPayload.value}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Barcode Type</span>
                            <span className={`font-bold ${theme.text} block mt-0.5`}>
                              {scannedPayload.type}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Validation Status</span>
                            <span className={`font-bold block mt-0.5 ${scannedPayload.isValid ? 'text-green-400' : 'text-rose-400'}`}>
                              {scannedPayload.isValid ? '✅ PASS' : '⚠️ WARNING'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Scan Timestamp</span>
                            <span className="text-slate-400 block mt-0.5 text-[10px]">
                              {new Date(scannedPayload.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        {scannedPayload.warning && (
                          <div className="p-3 bg-rose-500/10 border border-rose-900/30 rounded-xl text-[10px] text-rose-400 leading-relaxed font-bold">
                            ⚠️ {scannedPayload.warning}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full pt-2">
                        <button
                          onClick={() => {
                            setScannedPayload(null);
                            setShowManualForm(false);
                            startMedia();
                          }}
                          className={`py-3 rounded-xl border ${theme.border} ${theme.text} hover:bg-slate-500/10 flex items-center justify-center gap-2 text-xs font-bold transition-all`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry / Rescan
                        </button>
                        <button
                          onClick={handleSaveBarcodeConfirmation}
                          className="py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-black flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          Save to Note
                        </button>
                      </div>
                    </motion.div>
                  ) : showManualForm ? (
                    // Active Manual Form inside worked camera state
                    <motion.div
                      key="barcode-manual"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center space-y-4"
                    >
                      <div className={`p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-4 w-full`}>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-l-2 border-orange-500 pl-2">Manual Input Fallback</p>
                          <button
                            onClick={() => {
                              setShowManualForm(false);
                              startMedia();
                            }}
                            className="text-[10px] text-sky-400 font-bold hover:underline"
                          >
                            Switch to Camera Scan
                          </button>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Code Format Type</label>
                          <select
                            value={manualType}
                            onChange={(e) => setManualType(e.target.value)}
                            className={`w-full px-3 py-2.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl outline-none text-xs font-semibold`}
                          >
                            <option value="UPC-A">UPC-A (Retail Item)</option>
                            <option value="EAN-13">EAN-13 (Supermarket Product)</option>
                            <option value="ISBN">ISBN (Book/Textbook)</option>
                            <option value="QR Code">QR Code</option>
                            <option value="Custom">Custom / Code 128</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Raw Payload Value</label>
                          <input
                            type="text"
                            value={manualValue}
                            onChange={(e) => setManualValue(e.target.value)}
                            placeholder={manualType === 'UPC-A' ? 'e.g. 012345678905' : manualType === 'EAN-13' ? 'e.g. 5012345678900' : 'Enter barcode digits...'}
                            className={`w-full px-3 py-2.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-xl outline-none text-xs font-mono font-bold`}
                          />
                        </div>

                        <button
                          onClick={() => handleBarcodeDetected(manualValue, manualType)}
                          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                        >
                          Confirm Manual Entry
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    // Camera Active Barcode Scanning Screen
                    <motion.div
                      key="barcode-scanning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center space-y-4"
                    >
                      <div className="w-full aspect-video rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800">
                        <video 
                          ref={videoRef} 
                          className="w-full h-full object-cover transform -scale-x-100" 
                          playsInline 
                          muted 
                        />

                        {/* Laser scan animation overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-3/4 h-2/5 border-2 border-dashed border-sky-400/80 rounded-lg relative flex items-center justify-center overflow-hidden">
                            <div className="absolute w-full h-1 bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)] animate-pulse" />
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-slate-950/85 text-[10px] font-black uppercase tracking-widest text-sky-400 px-3 py-1 rounded-full border border-sky-900/30">
                              {barcodeStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full space-y-4">
                        <div className={`p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-left`}>
                          <div className="flex items-center justify-between">
                            <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Simulate Scanner Barcode Types
                            </span>
                            <button
                              onClick={() => {
                                stopMedia();
                                setShowManualForm(true);
                              }}
                              className="text-[10px] text-sky-400 font-bold hover:underline"
                            >
                              Keyboard Manual Fallback
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {(['UPC-A', 'EAN-13', 'ISBN', 'Custom'] as const).map(simType => (
                              <button
                                key={simType}
                                onClick={() => setBarcodeSimType(simType)}
                                className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                  barcodeSimType === simType
                                    ? 'bg-sky-500 border-transparent text-black'
                                    : 'bg-slate-500/5 border-slate-800 text-slate-400 hover:bg-slate-500/10'
                                }`}
                              >
                                {simType}
                              </button>
                            ))}
                          </div>

                          {barcodeSimType === 'Custom' && (
                            <input 
                              type="text"
                              value={customBarcodeText}
                              onChange={(e) => setCustomBarcodeText(e.target.value)}
                              className={`w-full px-3 py-1.5 bg-slate-950 text-slate-200 border border-slate-800 rounded-lg outline-none text-xs font-semibold`}
                              placeholder="Enter custom barcode digits..."
                            />
                          )}
                        </div>

                        <button 
                          onClick={triggerBarcodeScan}
                          className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                        >
                          <ScanLine className="w-4 h-4" />
                          Trigger Code Read & Decode
                        </button>
                      </div>
                    </motion.div>
                  )
                ) : (
                  // PHOTO, VIDEO, AUDIO CAPTURING MODES
                  !recordedUrl ? (
                    <motion.div 
                      key="active-capturer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center"
                    >
                      {/* Video Camera Window */}
                      {(mode === 'photo' || mode === 'video') && (
                        <div className="w-full aspect-video rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800">
                          <video 
                            ref={videoRef} 
                            className="w-full h-full object-cover transform -scale-x-100" 
                            playsInline 
                            muted 
                          />

                          {/* Video Record blinking light and duration */}
                          {recording && mode === 'video' && (
                            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-red-900/50 flex items-center gap-2 font-mono">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                              <span className="text-xs font-bold text-red-400">{formatTimer(timer)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Audio Recorder Canvas */}
                      {mode === 'audio' && (
                        <div className="w-full py-8 flex flex-col items-center space-y-6">
                          <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center border-2 border-dashed border-emerald-500/50 relative">
                            <AnimatePresence>
                              {recording && (
                                <motion.div 
                                  initial={{ scale: 0.9 }}
                                  animate={{ scale: [1, 1.25, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                  className="absolute inset-0 rounded-full bg-emerald-500/10"
                                />
                              )}
                            </AnimatePresence>
                            <Mic className={`w-8 h-8 ${recording ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                          </div>

                          {/* Timer */}
                          {recording && (
                            <div className="bg-slate-900/80 px-4 py-2 rounded-2xl border border-emerald-900/50 font-mono text-center">
                              <span className="text-sm font-bold text-emerald-400">{formatTimer(timer)}</span>
                            </div>
                          )}

                          {/* Real-Time Equalizer Waves */}
                          <canvas 
                            ref={canvasRef} 
                            width={400} 
                            height={80} 
                            className="w-full h-20 rounded-xl bg-slate-950 border border-slate-900" 
                          />
                        </div>
                      )}

                      {/* Capturing Actions */}
                      <div className="w-full mt-6 flex justify-center">
                        {mode === 'photo' && (
                          <button 
                            onClick={capturePhoto}
                            className="w-16 h-16 bg-white border-4 border-slate-700/50 hover:border-amber-500 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-90"
                          >
                            <span className="w-8 h-8 rounded-full bg-amber-500" />
                          </button>
                        )}

                        {mode === 'video' && (
                          <button 
                            onClick={recording ? stopRecording : startRecording}
                            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all hover:scale-105 active:scale-90 ${
                              recording 
                                ? 'bg-slate-900 border-rose-500/50 hover:border-rose-400' 
                                : 'bg-white border-slate-700/50 hover:border-rose-500'
                            }`}
                          >
                            {recording ? (
                              <Square className="w-6 h-6 text-rose-500 fill-rose-500" />
                            ) : (
                              <Circle className="w-8 h-8 text-rose-500 fill-rose-500" />
                            )}
                          </button>
                        )}

                        {mode === 'audio' && (
                          <button 
                            onClick={recording ? stopRecording : startRecording}
                            className={`px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                              recording 
                                ? 'bg-red-500 text-white animate-pulse' 
                                : 'bg-emerald-500 text-black'
                            }`}
                          >
                            {recording ? (
                              <>
                                <Square className="w-4 h-4 fill-white text-white" />
                                Stop Recording
                              </>
                            ) : (
                              <>
                                <Mic className="w-4 h-4" />
                                Start Voice Record
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    // Review / Playback Screen for Photo/Video/Audio
                    <motion.div 
                      key="review-recorded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col items-center space-y-4"
                    >
                      <div className="w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden aspect-video flex items-center justify-center relative">
                        {mode === 'photo' && (
                          <img src={recordedUrl} alt="Captured" className="w-full h-full object-cover" />
                        )}

                        {mode === 'video' && (
                          <video src={recordedUrl} className="w-full h-full object-cover" controls playsInline />
                        )}

                        {mode === 'audio' && (
                          <div className="w-full p-6 flex flex-col items-center justify-center space-y-4">
                            <Volume2 className="w-12 h-12 text-emerald-500 animate-pulse" />
                            <audio src={recordedUrl} controls className="w-full" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              Audio Recorded Successfully
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-slate-400 text-xs font-semibold text-center">
                        Review captured media and select Save Attachment to lock it in your note.
                      </p>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-3 w-full pt-4">
                        <button 
                          onClick={startMedia}
                          className={`py-3 rounded-xl border ${theme.border} ${theme.text} hover:bg-slate-500/10 flex items-center justify-center gap-2 text-xs font-bold transition-all`}
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retake Clip
                        </button>
                        <button 
                          onClick={handleConfirmSave}
                          className={`py-3 rounded-xl ${theme.accentBg} ${theme.accentHover} text-black flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider transition-all shadow-lg`}
                        >
                          <Check className="w-4 h-4" />
                          Save Attachment
                        </button>
                      </div>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Hidden Canvas helper */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
