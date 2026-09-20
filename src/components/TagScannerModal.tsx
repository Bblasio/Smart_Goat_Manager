import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  RefreshCw,
  Flashlight,
  Upload,
  CheckCircle2,
  AlertCircle,
  Search,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { GoatRecord } from '../types';

interface TagScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanTag: (tag: string, matchedGoat?: GoatRecord) => void;
  goats?: GoatRecord[];
  title?: string;
  subtitle?: string;
}

export const TagScannerModal: React.FC<TagScannerModalProps> = ({
  isOpen,
  onClose,
  onScanTag,
  goats = [],
  title = 'Scan Ear Tag / QR Code',
  subtitle = 'Point your camera at the goat ear tag barcode or QR code.'
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedTag, setDetectedTag] = useState<string | null>(null);
  const [matchedGoat, setMatchedGoat] = useState<GoatRecord | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'interactive-tag-scanner-region';

  // Find matching goat from the herd
  const findGoatByTag = (tag: string): GoatRecord | undefined => {
    if (!tag) return undefined;
    const clean = tag.trim().toLowerCase();
    return goats.find(
      g =>
        g.tag_number.toLowerCase() === clean ||
        g.id.toLowerCase() === clean ||
        (g.name && g.name.toLowerCase() === clean)
    );
  };

  const handleSuccessfulScan = (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const cleanText = decodedText.trim();
    setDetectedTag(cleanText);

    // Haptic feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([100, 50, 100]);
      } catch {
        // ignore
      }
    }

    const matched = findGoatByTag(cleanText);
    setMatchedGoat(matched || null);

    // Stop scanning on detection
    stopScanner();
    setIsProcessing(false);
  };

  const startScanner = async () => {
    setErrorMessage(null);
    setDetectedTag(null);
    setMatchedGoat(null);

    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF
        ],
        verbose: false
      });

      html5QrCodeRef.current = html5QrCode;

      const facingMode = useFrontCamera ? 'user' : 'environment';

      await html5QrCode.start(
        { facingMode },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Ignore transient frame decode failures
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.warn('Camera initiation failed:', err);
      setScannerActive(false);
      const msg =
        err?.name === 'NotAllowedError' || err?.message?.includes('Permission')
          ? 'Camera permission was denied. Please allow camera access in your browser, or select an image file / enter the tag manually.'
          : err?.message || 'Unable to access camera hardware. You can upload an image or type the tag manually.';
      setErrorMessage(msg);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    } finally {
      setScannerActive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM node to mount
      const timer = setTimeout(() => {
        startScanner();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen, useFrontCamera]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
      }
      const result = await html5QrCodeRef.current.scanFile(file, true);
      handleSuccessfulScan(result);
    } catch (err: any) {
      console.warn('Scan file error:', err);
      setErrorMessage('No valid barcode or QR code detected in this image. Please try a clearer picture or enter the tag manually.');
    }
  };

  const handleConfirmTag = (tagToUse: string, matched?: GoatRecord | null) => {
    onScanTag(tagToUse, matched || undefined);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const clean = manualInput.trim();
    const matched = findGoatByTag(clean);
    handleConfirmTag(clean, matched);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-stone-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Scanner Viewfinder Area */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center border-2 border-stone-300 dark:border-stone-700 shadow-inner">
            {/* HTML5 QR Code Mount Region */}
            <div id={scannerContainerId} className="w-full h-full object-cover" />

            {/* Overlaid Target Grid */}
            {scannerActive && !detectedTag && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-dashed border-emerald-400/90 rounded-2xl relative">
                  {/* Laser Scan line effect */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#34d399] top-1/2 -translate-y-1/2" />

                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-md" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-md" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-md" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-md" />
                </div>
                <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[11px] text-white font-medium">
                  Align barcode / QR code in box
                </div>
              </div>
            )}

            {/* Inactive or Error Overlay */}
            {!scannerActive && !detectedTag && (
              <div className="absolute inset-0 bg-stone-900/90 p-4 flex flex-col items-center justify-center text-center space-y-3">
                <Camera className="w-10 h-10 text-stone-500 animate-pulse" />
                <div className="text-xs text-stone-300 max-w-xs">
                  {errorMessage || 'Camera is offline. Check permissions or upload an ear tag photo.'}
                </div>
                <button
                  type="button"
                  onClick={startScanner}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}

            {/* Detected Tag Result Overlay */}
            {detectedTag && (
              <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-xs p-5 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Tag Scanned Successfully
                  </span>
                  <h4 className="text-xl font-black text-white mt-0.5 font-mono">
                    {detectedTag}
                  </h4>
                </div>

                {matchedGoat ? (
                  <div className="bg-stone-800/80 border border-stone-700 p-3 rounded-2xl text-left w-full text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {matchedGoat.name ? `${matchedGoat.name} (${matchedGoat.tag_number})` : matchedGoat.tag_number}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {matchedGoat.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-stone-400 text-[11px] flex items-center gap-2">
                      <span>{matchedGoat.breed}</span>
                      <span>•</span>
                      <span>{matchedGoat.gender}</span>
                      {matchedGoat.weight_kg && (
                        <>
                          <span>•</span>
                          <span>{matchedGoat.weight_kg} kg</span>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] max-w-xs">
                    Tag is not registered in herd yet. You can apply it directly to record a new animal or task.
                  </div>
                )}

                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedTag(null);
                      setMatchedGoat(null);
                      startScanner();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmTag(detectedTag, matchedGoat)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Use This Tag</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Camera Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setUseFrontCamera(prev => !prev)}
              className="flex-1 py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{useFrontCamera ? 'Use Rear Camera' : 'Switch Camera'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Tag Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Manual Tag Entry & Live Search */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              <span>Or Enter Tag Manually</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                  placeholder="Type tag (e.g. GT-101, KD-202)..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                Apply
              </button>
            </form>

            {/* Quick Match suggestions from herd */}
            {manualInput.trim().length >= 2 && (
              <div className="max-h-28 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 divide-y divide-stone-100 dark:divide-stone-700/60 text-xs">
                {goats
                  .filter(
                    g =>
                      g.tag_number.toLowerCase().includes(manualInput.toLowerCase()) ||
                      (g.name && g.name.toLowerCase().includes(manualInput.toLowerCase()))
                  )
                  .slice(0, 4)
                  .map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleConfirmTag(g.tag_number, g)}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-stone-800 dark:text-stone-200 transition-colors"
                    >
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {g.tag_number} {g.name ? `(${g.name})` : ''}
                      </span>
                      <span className="text-[10px] text-stone-500">{g.breed}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
