import { useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface CollaborativeSelectProps {
  portfolioId: string;
  fieldId: string;
  taskId?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

export function CollaborativeSelect({
  portfolioId,
  fieldId,
  taskId,
  value,
  onValueChange,
  children,
  placeholder,
  className,
  disabled,
  ...props
}: CollaborativeSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const {
    notifyFieldFocus,
    notifyFieldBlur,
    notifyFieldChange,
    getActiveFieldUser
  } = useWebSocket();

  const activeUser = getActiveFieldUser(fieldId, taskId);
  const isBeingEditedByOther = activeUser && !isFocused;

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setIsFocused(true);
      notifyFieldFocus(portfolioId, fieldId, taskId);
    } else {
      setIsFocused(false);
      notifyFieldBlur(portfolioId, fieldId, taskId);
    }
  }, [portfolioId, fieldId, taskId, notifyFieldFocus, notifyFieldBlur]);

  const handleValueChange = useCallback((newValue: string) => {
    onValueChange(newValue);
    notifyFieldChange(portfolioId, fieldId, newValue, taskId);
  }, [portfolioId, fieldId, taskId, onValueChange, notifyFieldChange]);

  const selectClasses = cn(
    className,
    isBeingEditedByOther && "ring-2 ring-orange-500 ring-opacity-50 border-orange-500"
  );

  return (
    <div className="relative">
      <Select
        value={value}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        {...props}
      >
        <SelectTrigger className={selectClasses}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {isBeingEditedByOther && (
        <div className="absolute -top-6 left-0 flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs font-medium">
          <User className="h-3 w-3" />
          <span>{activeUser.username} редактирует</span>
        </div>
      )}
    </div>
  );
}