import { useState } from 'react';
import { X, Package, Truck, ArrowRight, DollarSign, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button, Input, Card } from '@/components/ui';
import { dataStore } from '@/lib/dataStore';
import type { ServiceType } from '@/types';

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSuccess?: (trackingNumber: string) => void;
}

export function CreateShipmentModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  onSuccess,
}: CreateShipmentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [senderName, setSenderName] = useState(customerName || 'John Doe');
  const [senderPhone, setSenderPhone] = useState('+1 (555) 902-8310');
  const [senderAddress, setSenderAddress] = useState('742 Evergreen Terrace');
  const [senderCity, setSenderCity] = useState('New York');
  const [senderState, setSenderState] = useState('NY');
  const [senderPostalCode, setSenderPostalCode] = useState('10001');

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientState, setRecipientState] = useState('');
  const [recipientPostalCode, setRecipientPostalCode] = useState('');

  const [weight, setWeight] = useState<number>(2.5);
  const [dimensions, setDimensions] = useState('30 x 20 x 15 cm');
  const [serviceType, setServiceType] = useState<ServiceType>('EXPRESS');
  const [declaredValue, setDeclaredValue] = useState<number>(100);
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Price Calculation Engine
  const baseRates: Record<ServiceType, number> = {
    STANDARD: 15,
    EXPRESS: 30,
    SAME_DAY: 50,
    OVERNIGHT: 65,
    FREIGHT: 120,
  };

  const calculatedPrice = Number(
    (baseRates[serviceType] + weight * 3.5 + (declaredValue > 100 ? declaredValue * 0.02 : 0)).toFixed(
      2,
    ),
  );

  const estimatedDays: Record<ServiceType, string> = {
    STANDARD: '3 - 5 Business Days',
    EXPRESS: '1 - 2 Business Days',
    SAME_DAY: 'Today by 8:00 PM',
    OVERNIGHT: 'Tomorrow by 10:30 AM',
    FREIGHT: '5 - 7 Business Days',
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderAddress || !senderCity || !senderState || !senderPostalCode) {
      setError('Please complete all sender fields.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName || !recipientAddress || !recipientCity || !recipientState || !recipientPostalCode) {
      setError('Please complete all recipient details.');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = dataStore.createShipment({
        serviceType,
        status: 'CREATED',
        senderName,
        senderPhone,
        senderAddress,
        senderCity,
        senderState,
        senderPostalCode,
        recipientName,
        recipientPhone,
        recipientAddress,
        recipientCity,
        recipientState,
        recipientPostalCode,
        weight,
        dimensions,
        declaredValue,
        price: calculatedPrice,
        notes,
        estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
        currentCity: `${senderCity}, ${senderState}`,
        customerId: customerId || 'usr_customer1',
      });

      onClose();
      if (onSuccess) onSuccess(created.trackingNumber);
    } catch (err: any) {
      setError(err?.message || 'Failed to create shipment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-800 dark:bg-surface-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 pb-4 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Book New Shipment</h2>
              <p className="text-xs text-surface-400">Step {step} of 3 — Package & Destination details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="my-5 grid grid-cols-3 gap-2">
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 1 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 2 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 3 ? 'bg-primary-600' : 'bg-surface-200 dark:bg-surface-800'
            }`}
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-error-50 p-3 text-xs text-error-700 dark:bg-error-950/40 dark:text-error-400">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Sender Details */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">1. Sender Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Sender Name" value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
              <Input label="Sender Phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} required />
            </div>
            <Input label="Address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input label="City" value={senderCity} onChange={(e) => setSenderCity(e.target.value)} required />
              <Input label="State" value={senderState} onChange={(e) => setSenderState(e.target.value)} required />
              <Input label="Postal Code" value={senderPostalCode} onChange={(e) => setSenderPostalCode(e.target.value)} required />
            </div>

            <div className="flex justify-end pt-4 border-t border-surface-200 dark:border-surface-800">
              <Button type="submit" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue to Recipient
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Recipient Details */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">2. Recipient Information</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Recipient Full Name"
                placeholder="e.g. Jane Smith"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
              <Input
                label="Recipient Phone"
                placeholder="+1 (555) 000-1122"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
            </div>
            <Input
              label="Delivery Address"
              placeholder="123 Destination Way, Suite 400"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="City"
                placeholder="Chicago"
                value={recipientCity}
                onChange={(e) => setRecipientCity(e.target.value)}
                required
              />
              <Input
                label="State"
                placeholder="IL"
                value={recipientState}
                onChange={(e) => setRecipientState(e.target.value)}
                required
              />
              <Input
                label="Postal Code"
                placeholder="60611"
                value={recipientPostalCode}
                onChange={(e) => setRecipientPostalCode(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-surface-200 dark:border-surface-800">
              <Button variant="outline" type="button" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button type="submit" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Configure Package
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Package, Service & Pricing */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">3. Package Specs & Service Level</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Weight (kg)"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                required
              />
              <Input
                label="Dimensions (L x W x H)"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 30 x 20 x 15 cm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Service Level
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(['STANDARD', 'EXPRESS', 'SAME_DAY', 'OVERNIGHT', 'FREIGHT'] as ServiceType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setServiceType(type)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      serviceType === type
                        ? 'border-primary-600 bg-primary-50/50 text-primary-900 dark:bg-primary-950/40 dark:text-primary-100'
                        : 'border-surface-200 hover:border-surface-300 dark:border-surface-800 dark:hover:border-surface-700'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold">{type.replace('_', ' ')}</span>
                      <Truck className="h-3.5 w-3.5 text-primary-600" />
                    </div>
                    <span className="mt-1 text-2xs text-surface-500 dark:text-surface-400">
                      ${baseRates[type]} base
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Declared Value ($)"
                type="number"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Handling Notes (Optional)"
                placeholder="Fragile, do not drop, leave at door..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Price Quote Summary Card */}
            <Card className="bg-surface-50 border-surface-200 dark:bg-surface-800/60 dark:border-surface-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xs text-surface-400 uppercase tracking-wider font-bold">Estimated Delivery</p>
                  <p className="text-xs font-semibold text-surface-900 dark:text-surface-100">{estimatedDays[serviceType]}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xs text-surface-400 uppercase tracking-wider font-bold">Calculated Rate</p>
                  <p className="text-xl font-bold text-primary-600 dark:text-primary-400">${calculatedPrice.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-between pt-4 border-t border-surface-200 dark:border-surface-800">
              <Button variant="outline" type="button" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button type="submit" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                Confirm & Create Shipment (${calculatedPrice.toFixed(2)})
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
