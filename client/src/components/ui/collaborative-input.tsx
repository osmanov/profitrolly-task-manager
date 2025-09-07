import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface CollaborativeInputProps {
  portfolioId: string;
  fieldId: string;
  taskId?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  type?: 'input' | 'textarea';
  inputType?: string;
  disabled?: boolean;
  [key: string]: any;
}

export function CollaborativeInput({
  portfolioId,
  fieldId,
  taskId,
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  className,
  type = 'input',
  inputType,
  disabled,
  ...props
}: CollaborativeInputProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  const {
    notifyFieldFocus,
    notifyFieldBlur,
    notifyFieldChange,
    getActiveFieldUser
  } = useWebSocket();

  const activeUser = getActiveFieldUser(fieldId, taskId);
  const isBeingEditedByOther = activeUser && !isFocused;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    notifyFieldFocus(portfolioId, fieldId, taskId);
    onFocus?.();
  }, [portfolioId, fieldId, taskId, notifyFieldFocus, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    notifyFieldBlur(portfolioId, fieldId, taskId);
    onBlur?.();
  }, [portfolioId, fieldId, taskId, notifyFieldBlur, onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Debounced real-time notification
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      notifyFieldChange(portfolioId, fieldId, newValue, taskId);
    }, 300);
  }, [portfolioId, fieldId, taskId, onChange, notifyFieldChange]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const fieldKey = taskId ? `${fieldId}-${taskId}` : fieldId;

  const inputClasses = cn(
    className,
    isBeingEditedByOther && "ring-2 ring-orange-500 ring-opacity-50 border-orange-500",
    isFocused && "ring-2 ring-blue-500"
  );

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as any}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClasses}
        disabled={disabled}
        data-field-id={fieldKey}
        type={inputType}
        {...props}
      />
      {isBeingEditedByOther && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs font-medium">
          <User className="h-3 w-3" />
          <span>{activeUser.username} редактирует</span>
        </div>
      )}
    </div>
  );
}