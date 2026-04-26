import { DatePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import './DateInput.css';

dayjs.locale('es');

const FORMAT = 'YYYY-MM-DD';

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
  const disabledDate = min
    ? (d: dayjs.Dayjs) => d.isBefore(dayjs(min), 'day')
    : undefined;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6b4691',
          borderRadius: 12,
          fontFamily: 'inherit',
        },
      }}
    >
      <DatePicker
        value={value ? dayjs(value, FORMAT) : null}
        onChange={(d) => onChange?.(d ? d.format(FORMAT) : '')}
        format="DD/MM/YYYY"
        placeholder={placeholder}
        disabledDate={disabledDate}
        disabled={disabled}
        className={`date-input ${className ?? ''}`}
        style={{ width: '100%' }}
        getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
      />
    </ConfigProvider>
  );
}
