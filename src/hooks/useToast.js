import { useState, useCallback } from 'react';

/**
 * Hook per gestire le notifiche toast
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  return { toast, setToast, showToast };
}

export default useToast;
