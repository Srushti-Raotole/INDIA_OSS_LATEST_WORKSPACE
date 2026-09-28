import { useEffect } from 'react';

export function useForceLightMode() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');

    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      root.classList.remove('light');
      if (hadDark) {
        root.classList.add('dark');
      }
    };
  }, []);
}
