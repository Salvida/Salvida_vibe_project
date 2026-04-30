import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import SignatureCanvas from '../SignatureCanvas/SignatureCanvas';
import { useSignBooking } from '../../hooks/useBookings';
import type { Booking } from '../../types';
import './ContractModal.css';

interface ContractModalProps {
  booking: Booking;
  onClose: () => void;
  onSigned: () => void;
}

export default function ContractModal({ booking, onClose, onSigned }: ContractModalProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const signBooking = useSignBooking();

  const handleSubmit = useCallback(async () => {
    if (isEmpty) {
      toast.error(t('contract.emptySignatureError'));
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Extract base64 PNG without the data-URI prefix
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];

    try {
      await signBooking.mutateAsync({ id: booking.id, signatureImage: base64 });
      toast.success(t('contract.successMessage'));
      onSigned();
    } catch {
      // error toast handled by hook
    }
  }, [isEmpty, booking.id, signBooking, t, onSigned]);

  return (
    <div className="contract-modal-overlay" onClick={onClose}>
      <div className="contract-modal" onClick={(e) => e.stopPropagation()}>
        <div className="contract-modal__header">
          <h2 className="contract-modal__title">{t('contract.modalTitle')}</h2>
          <button type="button" className="contract-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="contract-modal__body">
          <h3 className="contract-modal__contract-title">{t('contract.title')}</h3>
          <p className="contract-modal__text">{t('contract.body1')}</p>
          <p className="contract-modal__text">{t('contract.body2')}</p>

          <div className="contract-modal__sig-section">
            <p className="contract-modal__sig-label">{t('contract.signatureLabel')}</p>
            <SignatureCanvas canvasRef={canvasRef} onEmpty={setIsEmpty} />
          </div>
        </div>

        <div className="contract-modal__footer">
          <button
            type="button"
            className="contract-modal__btn contract-modal__btn--secondary"
            onClick={onClose}
            disabled={signBooking.isPending}
          >
            {t('booking.cancel')}
          </button>
          <button
            type="button"
            className="contract-modal__btn contract-modal__btn--primary"
            onClick={handleSubmit}
            disabled={isEmpty || signBooking.isPending}
          >
            {signBooking.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t('contract.submitting')}
              </>
            ) : (
              t('contract.submitSignature')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
