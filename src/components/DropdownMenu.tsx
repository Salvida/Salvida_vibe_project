import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function DropdownMenu({ items, align = 'right' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="text-slate-400 hover:text-[#6b4691] transition-colors p-1 rounded-lg hover:bg-slate-50"
        aria-label="Más opciones"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-[160px] bg-white rounded-xl shadow-lg border border-slate-100 py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          role="menu"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors ${
                item.variant === 'danger'
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#6b4691]'
              }`}
              role="menuitem"
            >
              {item.icon && <span className="shrink-0">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
