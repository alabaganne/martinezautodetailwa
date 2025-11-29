import React from 'react';
import { Check, XCircle } from 'lucide-react';
import type { ChargeNotification } from '@/lib/types/admin';

interface ChargeResultNotificationProps {
  result: ChargeNotification | null;
  onDismiss: () => void;
}

/**
 * Success/error notification banner for no-show charge results
 * Auto-dismiss is handled by parent component
 */
export default function ChargeResultNotification({
  result,
  onDismiss,
}: ChargeResultNotificationProps) {
  if (!result) return null;

  return (
    <div
      className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
        result.type === 'success'
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}
    >
      {result.type === 'success' ? <Check size={20} /> : <XCircle size={20} />}
      {result.message}
    </div>
  );
}
