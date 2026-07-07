import { useEffect, useRef } from 'react';

/**
 * useFocusTrap — Accessibility utility
 *
 * Traps keyboard focus inside the given container ref when `active` is true.
 * Useful for modal dialogs, drawers, and any overlay that should prevent
 * focus from escaping to background content.
 *
 * Usage:
 *   const dialogRef = useRef(null);
 *   useFocusTrap(dialogRef, isOpen);
 *
 * @param {React.RefObject} containerRef - Ref of the container element
 * @param {boolean}         active       - Whether the trap is engaged
 */
export function useFocusTrap(containerRef, active) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef?.current) return;

    // Remember which element was focused before the trap activated
    previousFocusRef.current = document.activeElement;

    const FOCUSABLE_SELECTORS = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusable = () =>
      Array.from(containerRef.current?.querySelectorAll(FOCUSABLE_SELECTORS) ?? []);

    // Auto-focus the first focusable element inside the container
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusableNow = getFocusable();
      if (focusableNow.length === 0) return;

      const first = focusableNow[0];
      const last  = focusableNow[focusableNow.length - 1];

      if (e.shiftKey) {
        // Shift+Tab — going backward
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab — going forward
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the element that was active before trap activated
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, containerRef]);
}
