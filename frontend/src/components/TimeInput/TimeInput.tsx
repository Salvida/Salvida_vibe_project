import { TimePicker, ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import './TimeInput.css';

const FORMAT = 'HH:mm';

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
  placeholder = 'Seleccioná una hora',
  className,
  disabled,
}: TimeInputProps) {
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
      <TimePicker
        value={value ? dayjs(value, FORMAT) : null}
        onChange={(d) => onChange?.(d ? d.format(FORMAT) : '')}
        format={FORMAT}
        minuteStep={5}
        placeholder={placeholder}
        disabled={disabled}
        className={`time-input ${className ?? ''}`}
        style={{ width: '100%' }}
        needConfirm={false}
        getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
      />
    </ConfigProvider>
  );
}
