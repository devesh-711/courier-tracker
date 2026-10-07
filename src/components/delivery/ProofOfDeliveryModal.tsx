import { useState, useRef } from 'react';
import { X, Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  recipientNameDefault: string;
  onSubmitProof: (proof: {
    photoUrl?: string;
    signatureDataUrl?: string;
    recipientName: string;
    notes: string;
  }) => void;
}

export function ProofOfDeliveryModal({
  isOpen,
  onClose,
  trackingNumber,
  recipientNameDefault,
  onSubmitProof,
}: ProofOfDeliveryModalProps) {
  const [recipientName, setRecipientName] = useState(recipientNameDefault || '');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset sample photo
  const handleSamplePhoto = () => {
    setPhotoUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600');
  };

  // Canvas signature drawing logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]!.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]!.clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitProof({
      photoUrl,
      signatureDataUrl: signatureUrl,
      recipientName,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-800 dark:bg-surface-900">
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-800">
          <div>
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">Upload Proof of Delivery</h3>
            <p className="text-xs text-surface-400">Tracking Number: {trackingNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Received By (Recipient Name)"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            required
          />

          {/* Delivery Photo Section */}
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
              Photo Proof (Package at doorstep / handed to recipient)
            </label>
            {photoUrl ? (
              <div className="relative rounded-xl border border-surface-200 overflow-hidden bg-black/5 dark:border-surface-700">
                <img src={photoUrl} alt="Delivery proof" className="h-44 w-full object-cover" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute right-2 top-2 rounded-lg bg-error-600 p-1.5 text-white shadow"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800/50 dark:hover:bg-surface-800">
                  <Camera className="h-6 w-6 text-surface-400" />
                  <span className="mt-1 text-xs text-surface-500">Click to upload photo from camera / file</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                <button
                  type="button"
                  onClick={handleSamplePhoto}
                  className="text-2xs text-primary-600 hover:underline text-left dark:text-primary-400"
                >
                  + Attach sample delivery photo
                </button>
              </div>
            )}
          </div>

          {/* Digital Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-surface-700 dark:text-surface-300">
                E-Signature (Draw on touchscreen/mouse)
              </label>
              {signatureUrl && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-2xs text-error-600 hover:underline dark:text-error-400"
                >
                  Clear Signature
                </button>
              )}
            </div>
            <div className="rounded-xl border border-surface-300 bg-surface-50 dark:border-surface-700 dark:bg-surface-800/80">
              <canvas
                ref={canvasRef}
                width={400}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[120px] cursor-crosshair touch-none rounded-xl"
              />
            </div>
          </div>

          <Input
            label="Delivery Notes / Remarks"
            placeholder="e.g. Handed to receptionist, left behind gate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-200 dark:border-surface-800">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
              Confirm Delivery & Submit Proof
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
