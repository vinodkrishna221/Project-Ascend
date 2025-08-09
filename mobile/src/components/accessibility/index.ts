/**
 * Accessibility components and utilities for the mobile authentication flow
 * Provides comprehensive accessibility support including screen reader support,
 * keyboard navigation, high contrast themes, and time extensions
 */

export { default as HighContrastProvider, useHighContrast } from './HighContrastProvider';
export { 
  default as KeyboardNavigation, 
  useKeyboardNavigation, 
  Focusable, 
  SkipLink, 
  FocusTrap 
} from './KeyboardNavigation';
export { default as TimeExtension } from './TimeExtension';

// Re-export accessibility utilities
export {
  useAccessibility,
  AccessibilityHelpers,
  AccessibilityConstants,
  AccessibilityUtils,
  AccessibilityManager
} from '../../utils/accessibility';