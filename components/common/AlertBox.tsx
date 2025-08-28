import React from 'react';
import { Check, AlertCircle, XCircle } from 'lucide-react';

interface AlertBoxProps {
  variant: 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

const variantStyles = {
  success: {
    container: 'bg-green-50 border-green-700',
    text: 'text-green-700',
    defaultIcon: <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
  },
  warning: {
    container: 'bg-amber-50 border-amber-700',
    text: 'text-amber-700',
    defaultIcon: <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
  },
  error: {
    container: 'bg-red-50 border-red-700',
    text: 'text-red-700',
    defaultIcon: <XCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
  }
};

export const AlertBox: React.FC<AlertBoxProps> = ({ variant, title, message, icon }) => {
  const styles = variantStyles[variant];
  const displayIcon = icon || styles.defaultIcon;

  return (
    <div className={`mt-4 p-4 rounded-xl border ${styles.container}`}>
      <div className={`flex items-start ${styles.text}`}>
        {displayIcon}
        <div className="text-sm">
          {title && <p className="font-semibold">{title}</p>}
          <p className={title ? 'mt-1' : 'font-medium'}>{message}</p>
        </div>
      </div>
    </div>
  );
};