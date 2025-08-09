import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Accessibility utilities for the mobile authentication flow
 * Provides screen reader support, keyboard navigation, and inclusive design features
 */

export interface AccessibilityConfig {
  announceOnFocus?: boolean;
  announceOnChange?: boolean;
  extendedTimeouts?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig = {};
  private isScreenReaderEnabled = false;
  private isReduceMotionEnabled = false;
  private isHighContrastEnabled = false;

  private constructor() {
    this.initializeAccessibilityState();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private async initializeAccessibilityState(): Promise<void> {
    try {
      // Check screen reader status
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Check reduce motion preference
      if (Platform.OS === 'ios') {
        this.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      }

      // Listen for accessibility changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
      
      if (Platform.OS === 'ios') {
        AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      }
    } catch (error) {
      console.warn('Failed to initialize accessibility state:', error);
    }
  }

  private handleScreenReaderChange = (isEnabled: boolean): void => {
    this.isScreenReaderEnabled = isEnabled;
    this.config.announceOnFocus = isEnabled;
    this.config.announceOnChange = isEnabled;
  };

  private handleReduceMotionChange = (isEnabled: boolean): void => {
    this.isReduceMotionEnabled = isEnabled;
    this.config.reducedMotion = isEnabled;
  };

  public getConfig(): AccessibilityConfig {
    return {
      ...this.config,
      extendedTimeouts: this.isScreenReaderEnabled,
    };
  }

  public isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }

  public shouldReduceMotion(): boolean {
    return this.isReduceMotionEnabled || this.config.reducedMotion || false;
  }

  public shouldUseHighContrast(): boolean {
    return this.isHighContrastEnabled || this.config.highContrast || false;
  }

  public announceForScreenReader(message: string, priority: 'low' | 'high' = 'low'): void {
    if (this.isScreenReaderEnabled) {
      // Add slight delay for better screen reader experience
      setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(message);
      }, priority === 'high' ? 100 : 500);
    }
  }

  public announcePageChange(pageName: string, description?: string): void {
    const message = description 
      ? `${pageName}. ${description}`
      : `Navigated to ${pageName}`;
    this.announceForScreenReader(message, 'high');
  }

  public announceFormError(fieldName: string, errorMessage: string): void {
    const message = `${fieldName} error: ${errorMessage}`;
    this.announceForScreenReader(message, 'high');
  }

  public announceSuccess(message: string): void {
    this.announceForScreenReader(`Success: ${message}`, 'high');
  }

  public announceProgress(current: number, total: number, stepName?: string): void {
    const stepInfo = stepName ? ` ${stepName}` : '';
    const message = `Step ${current} of ${total}${stepInfo} completed`;
    this.announceForScreenReader(message);
  }

  public getExtendedTimeout(baseTimeout: number): number {
    return this.isScreenReaderEnabled ? baseTimeout * 2 : baseTimeout;
  }

  public cleanup(): void {
    // Note: removeEventListener is not available in newer React Native versions
    // Event listeners are automatically cleaned up when the component unmounts
  }
}

/**
 * Hook for using accessibility manager in components
 */
export const useAccessibility = () => {
  return AccessibilityManager.getInstance();
};

/**
 * Accessibility helpers for common patterns
 */
export const AccessibilityHelpers = {
  /**
   * Generate accessibility props for form inputs
   */
  getInputProps: (
    label: string,
    hint?: string,
    error?: string,
    required = false
  ) => ({
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRequired: required,
    accessibilityInvalid: !!error,
    accessibilityErrorMessage: error,
  }),

  /**
   * Generate accessibility props for buttons
   */
  getButtonProps: (
    label: string,
    hint?: string,
    disabled = false,
    pressed = false
  ) => ({
    accessibilityRole: 'button' as const,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled, pressed },
  }),

  /**
   * Generate accessibility props for progress indicators
   */
  getProgressProps: (current: number, total: number, label?: string) => ({
    accessibilityRole: 'progressbar' as const,
    accessibilityValue: { min: 0, max: total, now: current },
    accessibilityLabel: label || `Progress: ${current} of ${total}`,
  }),

  /**
   * Generate accessibility props for tabs
   */
  getTabProps: (label: string, selected = false, index?: number) => ({
    accessibilityRole: 'tab' as const,
    accessibilityLabel: label,
    accessibilityState: { selected },
    accessibilityHint: selected ? 'Currently selected tab' : 'Tap to select this tab',
  }),

  /**
   * Generate accessibility props for alerts/notifications
   */
  getAlertProps: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => ({
    accessibilityRole: 'alert' as const,
    accessibilityLabel: `${type}: ${message}`,
    accessibilityLiveRegion: 'polite' as const,
  }),

  /**
   * Generate accessibility props for headings
   */
  getHeadingProps: (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => ({
    accessibilityRole: 'header' as const,
    accessibilityLevel: level,
    accessibilityLabel: text,
  }),
};

/**
 * Accessibility constants for consistent behavior
 */
export const AccessibilityConstants = {
  // Minimum touch target size (44x44 points)
  MIN_TOUCH_TARGET: 44,
  
  // Minimum spacing between touch targets
  MIN_TOUCH_SPACING: 8,
  
  // Extended timeouts for screen reader users
  EXTENDED_TIMEOUT_MULTIPLIER: 2,
  
  // Animation durations (reduced for accessibility)
  ANIMATION_DURATION: {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 500,
    REDUCED: 100, // For users who prefer reduced motion
  },
  
  // Color contrast ratios
  CONTRAST_RATIOS: {
    NORMAL_TEXT: 4.5,
    LARGE_TEXT: 3.0,
    UI_COMPONENTS: 3.0,
  },
  
  // Font sizes for accessibility
  FONT_SIZES: {
    MIN_READABLE: 16,
    LARGE_TEXT: 18,
    EXTRA_LARGE: 20,
  },
};

/**
 * Utility functions for accessibility
 */
export const AccessibilityUtils = {
  /**
   * Check if a color combination meets WCAG contrast requirements
   */
  meetsContrastRequirement: (
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA'
  ): boolean => {
    // This would typically use a color contrast calculation library
    // For now, return true as a placeholder
    return true;
  },

  /**
   * Get appropriate animation duration based on user preferences
   */
  getAnimationDuration: (baseDuration: number): number => {
    const accessibility = AccessibilityManager.getInstance();
    return accessibility.shouldReduceMotion() 
      ? AccessibilityConstants.ANIMATION_DURATION.REDUCED 
      : baseDuration;
  },

  /**
   * Format text for screen readers
   */
  formatForScreenReader: (text: string): string => {
    return text
      .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  },

  /**
   * Create descriptive text for complex UI elements
   */
  createDescription: (
    element: string,
    state?: string,
    position?: { current: number; total: number }
  ): string => {
    let description = element;
    
    if (state) {
      description += `, ${state}`;
    }
    
    if (position) {
      description += `, ${position.current} of ${position.total}`;
    }
    
    return description;
  },
};

export default AccessibilityManager;