import React from 'react';
import { Check, AlertCircle, XCircle, Info } from 'lucide-react';

interface AlertBoxProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

type VariantKey = AlertBoxProps['variant'];

const variantStyles: Record<VariantKey, { container: string; text: string; defaultIcon: React.ReactNode }> = {
  success: {
    container: 'bg-green-50 border-green-700',
    text: 'text-green-700',
    defaultIcon: <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
  },
  warning: {
    container: 'bg-orange-50 border-orange-500',
    text: 'text-orange-600',
    defaultIcon: <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
  },
  error: {
    container: 'bg-red-50 border-red-700',
    text: 'text-red-700',
    defaultIcon: <XCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
  },
  info: {
    container: 'bg-blue-50 border-blue-500',
    text: 'text-blue-700',
    defaultIcon: <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
  }
};

export const AlertBox: React.FC<AlertBoxProps> = ({ variant, title, message, icon }) => {
  const styles = variantStyles[variant];
  const displayIcon = icon || styles.defaultIcon;

  return (
    <div className={`mt-4 p-4 rounded-xl border-2 ${styles.container}`}>
      <div className={`flex ${styles.text} ${title ? 'items-start' : 'items-center'}`}>
        {displayIcon}
        <div className="text-sm font-medium">
          {title && <p className="font-semibold">{title}</p>}
          <p className={title ? 'mt-1' : 'font-medium'}>{message}</p>
        </div>
      </div>
    </div>
  );
};