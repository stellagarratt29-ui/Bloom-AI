import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useApp } from '../context/AppContext';

// Injects/removes a <style> tag that applies dyslexia-friendly CSS globally.
// No-op on native (only runs on web).
export default function DyslexiaStyleInjector() {
  const { ndToggles } = useApp();
  const dyslexia = !!ndToggles?.dyslexiaMode;
  const textSize = ndToggles?.textSize || 'normal';

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let el = document.getElementById('bloom-a11y');
    if (!el) {
      el = document.createElement('style');
      el.id = 'bloom-a11y';
      document.head.appendChild(el);
    }

    if (!dyslexia) {
      el.textContent = '';
      return;
    }

    const zoom = textSize === 'xl' ? '1.35' : textSize === 'large' ? '1.18' : '1';

    el.textContent = `
      body { zoom: ${zoom}; }
      div, span {
        letter-spacing: 0.5px !important;
        word-spacing: 2px !important;
        line-height: 1.7 !important;
        font-family: Arial, Verdana, sans-serif !important;
      }
    `;
  }, [dyslexia, textSize]);

  return null;
}
