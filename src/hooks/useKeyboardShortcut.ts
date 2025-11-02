import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
}

export const useKeyboardShortcut = ({
  key,
  ctrlKey = false,
  shiftKey = false,
  metaKey = false,
  callback,
}: KeyboardShortcutOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrMeta = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const isShift = shiftKey ? event.shiftKey : !event.shiftKey;
      const isMeta = metaKey ? event.metaKey : true;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        isCtrlOrMeta &&
        isShift
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrlKey, shiftKey, metaKey, callback]);
};
