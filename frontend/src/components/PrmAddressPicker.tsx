import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Address } from '../types';
import { usePrmAddresses } from '../hooks/usePrmAddresses';
import AddressMapPreview from '../pages/Addresses/AddressMapPreview';
import './PrmAddressPicker.css';

interface PrmAddressPickerProps {
  prmId: string | null;
  value: Partial<Address> | undefined;
  onChange: (addr: Partial<Address>) => void;
}

export default function PrmAddressPicker({
  prmId,
  value,
  onChange,
}: PrmAddressPickerProps) {
  const { t } = useTranslation();
  const { data: addresses, isLoading } = usePrmAddresses(prmId);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedChipId(null);
  }, [prmId]);

  const validatedAddresses = (addresses ?? []).filter(
    (a) => a.validation_status === 'validated',
  );

  useEffect(() => {
    if (value?.id && addresses) {
      const match = validatedAddresses.find((a) => a.id === value.id);
      if (match) setSelectedChipId(match.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, value?.id]);

  function selectChip(addr: Address) {
    setSelectedChipId(addr.id);
    onChange({
      id: addr.id,
      full_address: addr.full_address,
      lat: addr.lat,
      lng: addr.lng,
      validation_status: addr.validation_status,
    });
  }

  const selectedAddress = validatedAddresses.find((a) => a.id === selectedChipId);

  if (isLoading) {
    return (
      <div className="prm-addr-picker">
        <div className="prm-addr-picker__chips">
          <div className="prm-addr-chip prm-addr-chip--skeleton" />
          <div className="prm-addr-chip prm-addr-chip--skeleton" style={{ width: '8rem' }} />
        </div>
      </div>
    );
  }

  if (!prmId || validatedAddresses.length === 0) {
    return (
      <div className="prm-addr-picker__empty">
        <MapPin size={15} />
        <span>
          {t('booking.noValidatedAddresses')}{' '}
          {prmId && (
            <Link to={`/app/prms/${prmId}`} className="prm-addr-picker__empty-link">
              {t('booking.addAddressFromProfile')}
            </Link>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="prm-addr-picker">
      <div className="prm-addr-picker__chips">
        {validatedAddresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            className={`prm-addr-chip${selectedChipId === addr.id ? ' prm-addr-chip--active' : ''}`}
            onClick={() => selectChip(addr)}
          >
            <span className="prm-addr-chip__alias">{addr.alias || addr.full_address.split(',')[0]}</span>
            <span className="prm-addr-chip__address">{addr.full_address}</span>
          </button>
        ))}
      </div>

      {selectedAddress?.lat != null && selectedAddress?.lng != null && (
        <div className="prm-addr-picker__map">
          <AddressMapPreview lat={selectedAddress.lat} lng={selectedAddress.lng} height="160px" />
        </div>
      )}
    </div>
  );
}
