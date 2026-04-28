import { useMemo } from 'react';
import { TimePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import './TimeInput.css';

const FORMAT = 'HH:mm';

const THEME = {
  token: {
    colorPrimary: '#6b4691',
    borderRadius: 12,
    fontFamily: 'inherit',
  },
} as const;

interface TimeInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function TimeInput({
  value,
  onChange,
  placeholder = 'Selecciona una hora',
  className,
  disabled,
}: TimeInputProps) {
  // Memoize so antd doesn't see a new object reference on every render
  const dayjsValue = useMemo(() => (value ? dayjs(value, FORMAT) : null), [value]);

  return (
    <ConfigProvider theme={THEME}>
      <TimePicker
        value={dayjsValue}
        onChange={(d) => onChange?.(d ? d.format(FORMAT) : '')}
        format={FORMAT}
        minuteStep={5}
        placeholder={placeholder}
        disabled={disabled}
        className={`time-input ${className ?? ''}`}
        style={{ width: '100%' }}
        needConfirm={false}
        getPopupContainer={() => document.body}
      />
    </ConfigProvider>
  );
}
