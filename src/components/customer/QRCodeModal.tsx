import { X, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  recipientName: string;
  destination: string;
}

export function QRCodeModal({ isOpen, onClose, trackingNumber, recipientName, destination }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a procedural SVG QR Code matrix for the tracking string
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    trackingNumber,
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-800">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">Shipment QR Code</h3>
            <p className="text-2xs text-surface-400">Scan for instant status update</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-6 flex flex-col items-center text-center">
          <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm dark:border-surface-700">
            <img
              src={qrSvgUrl}
              alt={`QR Code for ${trackingNumber}`}
              className="h-44 w-44 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-100 px-3 py-1.5 dark:bg-surface-800">
            <span className="font-mono text-sm font-bold text-surface-900 dark:text-surface-100">
              {trackingNumber}
            </span>
            <button
              onClick={handleCopy}
              className="text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Copy Tracking Number"
            >
              {copied ? <Check className="h-4 w-4 text-success-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-3 text-xs text-surface-500 dark:text-surface-400">
            <p className="font-medium text-surface-700 dark:text-surface-300">To: {recipientName}</p>
            <p className="text-2xs">{destination}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
          <a
            href={qrSvgUrl}
            download={`QR-${trackingNumber}.png`}
            target="_blank"
            rel="noreferrer"
            className="w-full"
          >
            <Button className="w-full" leftIcon={<Download className="h-4 w-4" />}>
              Save QR
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
