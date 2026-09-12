import React, { forwardRef, useRef, useState, useCallback, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: string;
}

function toDisplay(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, value, onChange, onBlur, className = '', id, ...restProps }, forwardedRef) => {
    const nativeRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState('');

    const mergedRef = useCallback(
      (el: HTMLInputElement | null) => {
        (nativeRef as MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) (forwardedRef as MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [forwardedRef],
    );

    // Read initial value set by react-hook-form (defaultValues) after mount
    useEffect(() => {
      const el = nativeRef.current;
      if (el?.value) setLocalValue(el.value);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    };

    const effectiveValue = value !== undefined ? String(value || '') : localValue;
    const displayText = toDisplay(effectiveValue);

    const openPicker = () => {
      const el = nativeRef.current;
      if (!el || restProps.disabled) return;
      try {
        if (typeof (el as unknown as { showPicker?: () => void }).showPicker === 'function') {
          (el as unknown as { showPicker: () => void }).showPicker();
        } else {
          el.click();
        }
      } catch {
        el.click();
      }
    };

    const inputId =
      id ||
      (restProps.name as string) ||
      (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div
          className={`relative w-full flex items-center px-4 py-2 border rounded-lg bg-white cursor-pointer text-sm transition-colors focus-within:ring-2 ${
            error
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-gray-300 focus-within:ring-primary focus-within:border-transparent'
          } ${restProps.disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${className}`}
          onClick={openPicker}
        >
          <span className={`flex-1 select-none ${displayText ? 'text-gray-900' : 'text-gray-400'}`}>
            {displayText || 'dd/mm/aaaa'}
          </span>
          <Calendar className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
          <input
            ref={mergedRef}
            id={inputId}
            type="date"
            value={value !== undefined ? (value as string) : undefined}
            onChange={handleChange}
            onBlur={onBlur}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            {...restProps}
          />
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  },
);

DateInput.displayName = 'DateInput';
