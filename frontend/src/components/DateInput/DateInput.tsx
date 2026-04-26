import { useMemo } from 'react';
import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import './DateInput.css';

dayjs.locale('es');

const FORMAT = 'YYYY-MM-DD';

const THEME = {
  token: {
    colorPrimary: '#6b4691',
    borderRadius: 12,
    fontFamily: 'inherit',
  },
} as const;

interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function DateInput({
  value,
  onChange,
  min,
  placeholder = 'Seleccioná una fecha',
  className,
  disabled,
}: DateInputProps) {
  // Memoize so antd doesn't see a new object reference on every render
  const dayjsValue = useMemo(() => (value ? dayjs(value, FORMAT) : null), [value]);
  const disabledDate = useMemo(
    () => (min ? (d: dayjs.Dayjs) => d.isBefore(dayjs(min), 'day') : undefined),
    [min],
  );

  return (
    <ConfigProvider theme={THEME}>
      <DatePicker
        value={dayjsValue}
        onChange={(d) => onChange?.(d ? d.format(FORMAT) : '')}
        format="DD/MM/YYYY"
        placeholder={placeholder}
        disabledDate={disabledDate}
        disabled={disabled}
        className={`date-input ${className ?? ''}`}
        style={{ width: '100%' }}
        getPopupContainer={() => document.body}
      />
    </ConfigProvider>
  );
}
