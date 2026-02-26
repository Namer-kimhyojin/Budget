import { useCallback, useState } from 'react';

export function useToastQueue(timeoutMs = 2200) {
  const [toastItems, setToastItems] = useState([]);

  const pushToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToastItems((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToastItems((prev) => prev.filter((item) => item.id !== id));
    }, timeoutMs);
  }, [timeoutMs]);

  return { toastItems, pushToast };
}

