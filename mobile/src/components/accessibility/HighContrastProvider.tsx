import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AccessibilityInfo, ColorSchemeName, useColorScheme } from 'react-native';
import { AccessibilityManager } from '../../utils/accessibility';

interface HighContrastTheme {
  colors: {
    // Background colors
    background: string;
    surface: string;
    surfaceVariant: string;
    
    // Text colors
    onBackground: string;
    onSurface: string;
    onSurfaceVariant: string;
    
    // Primary colors
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    
    // Secondary colors
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;
    
    // Error colors
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;
    
    // Success colors
    success: string;
    onSuccess: string;
    successContainer: string;
    onSuccessContainer: string;
    
    // Warning colors
    warning: string;
    onWarning: string;
    warningContainer: string;
    onWarningContainer: string;
    
    // Border and outline colors
    outline: string;
    outlineVariant: string;
    
    // Interactive states
    disabled: string;
    onDisabled: string;
    
    // Focus indicators
    focus: string;
    focusRing: string;
  };
  
  // Typography with enhanced contrast
  typography: {
    fontWeights: {
      normal: '500'; // Increased from 400 for better readability
      medium: '600'; // Increased from 500
      semibold: '700'; // Increased from 600
      bold: '800'; // Increased from 700
    };
    
    // Minimum font sizes for accessibility
    fontSizes: {
      small: 16; // Increased from 14
      medium: 18; // Increased from 16
      large: 20; // Increased from 18
      xlarge: 24; // Increased from 20
    };
  };
  
  // Spacing for better touch targets
  spacing: {
    minTouchTarget: 48; // Increased from 44
    touchSpacing: 12; // Increased from 8
  };
  
  // Border widths for better visibility
  borders: {
    thin: 2; // Increased from 1
    medium: 3; // Increased from 2
    thick: 4; // Increased from 3
    focus: 4; // Focus ring width
  };
}

const createHighContrastTheme = (isDark: boolean): HighContrastTheme => {
  if (isDark) {
    return {
      colors: {
        // Dark high contrast theme
        background: '#000000',
        surface: '#1A1A1A',
        surfaceVariant: '#2D2D2D',
        
        onBackground: '#FFFFFF',
        onSurface: '#FFFFFF',
        onSurfaceVariant: '#FFFFFF',
        
        primary: '#4D9FFF',
        onPrimary: '#000000',
        primaryContainer: '#0066CC',
        onPrimaryContainer: '#FFFFFF',
        
        secondary: '#FFB84D',
        onSecondary: '#000000',
        secondaryContainer: '#CC8800',
        onSecondaryContainer: '#FFFFFF',
        
        error: '#FF4D4D',
        onError: '#000000',
        errorContainer: '#CC0000',
        onErrorContainer: '#FFFFFF',
        
        success: '#4DFF4D',
        onSuccess: '#000000',
        successContainer: '#00CC00',
        onSuccessContainer: '#FFFFFF',
        
        warning: '#FFFF4D',
        onWarning: '#000000',
        warningContainer: '#CCCC00',
        onWarningContainer: '#000000',
        
        outline: '#FFFFFF',
        outlineVariant: '#CCCCCC',
        
        disabled: '#666666',
        onDisabled: '#CCCCCC',
        
        focus: '#FFFF00',
        focusRing: '#FFFF00',
      },
      typography: {
        fontWeights: {
          normal: '500',
          medium: '600',
          semibold: '700',
          bold: '800',
        },
        fontSizes: {
          small: 16,
          medium: 18,
          large: 20,
          xlarge: 24,
        },
      },
      spacing: {
        minTouchTarget: 48,
        touchSpacing: 12,
      },
      borders: {
        thin: 2,
        medium: 3,
        thick: 4,
        focus: 4,
      },
    };
  } else {
    return {
      colors: {
        // Light high contrast theme
        background: '#FFFFFF',
        surface: '#F5F5F5',
        surfaceVariant: '#E0E0E0',
        
        onBackground: '#000000',
        onSurface: '#000000',
        onSurfaceVariant: '#000000',
        
        primary: '#0066CC',
        onPrimary: '#FFFFFF',
        primaryContainer: '#CCE5FF',
        onPrimaryContainer: '#000000',
        
        secondary: '#CC6600',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#FFE5CC',
        onSecondaryContainer: '#000000',
        
        error: '#CC0000',
        onError: '#FFFFFF',
        errorContainer: '#FFCCCC',
        onErrorContainer: '#000000',
        
        success: '#006600',
        onSuccess: '#FFFFFF',
        successContainer: '#CCFFCC',
        onSuccessContainer: '#000000',
        
        warning: '#CC9900',
        onWarning: '#000000',
        warningContainer: '#FFFFCC',
        onWarningContainer: '#000000',
        
        outline: '#000000',
        outlineVariant: '#666666',
        
        disabled: '#CCCCCC',
        onDisabled: '#666666',
        
        focus: '#FF0000',
        focusRing: '#FF0000',
      },
      typography: {
        fontWeights: {
          normal: '500',
          medium: '600',
          semibold: '700',
          bold: '800',
        },
        fontSizes: {
          small: 16,
          medium: 18,
          large: 20,
          xlarge: 24,
        },
      },
      spacing: {
        minTouchTarget: 48,
        touchSpacing: 12,
      },
      borders: {
        thin: 2,
        medium: 3,
        thick: 4,
        focus: 4,
      },
    };
  }
};

const createStandardTheme = (isDark: boolean): HighContrastTheme => {
  if (isDark) {
    return {
      colors: {
        background: '#1F2937',
        surface: '#374151',
        surfaceVariant: '#4B5563',
        
        onBackground: '#F9FAFB',
        onSurface: '#F9FAFB',
        onSurfaceVariant: '#E5E7EB',
        
        primary: '#3B82F6',
        onPrimary: '#FFFFFF',
        primaryContainer: '#1E40AF',
        onPrimaryContainer: '#DBEAFE',
        
        secondary: '#F59E0B',
        onSecondary: '#000000',
        secondaryContainer: '#D97706',
        onSecondaryContainer: '#FEF3C7',
        
        error: '#EF4444',
        onError: '#FFFFFF',
        errorContainer: '#DC2626',
        onErrorContainer: '#FEE2E2',
        
        success: '#10B981',
        onSuccess: '#FFFFFF',
        successContainer: '#059669',
        onSuccessContainer: '#D1FAE5',
        
        warning: '#F59E0B',
        onWarning: '#000000',
        warningContainer: '#D97706',
        onWarningContainer: '#FEF3C7',
        
        outline: '#6B7280',
        outlineVariant: '#9CA3AF',
        
        disabled: '#9CA3AF',
        onDisabled: '#6B7280',
        
        focus: '#3B82F6',
        focusRing: '#93C5FD',
      },
      typography: {
        fontWeights: {
          normal: '500',
          medium: '600',
          semibold: '700',
          bold: '800',
        },
        fontSizes: {
          small: 16,
          medium: 18,
          large: 20,
          xlarge: 24,
        },
      },
      spacing: {
        minTouchTarget: 48,
        touchSpacing: 12,
      },
      borders: {
        thin: 2,
        medium: 3,
        thick: 4,
        focus: 4,
      },
    };
  } else {
    return {
      colors: {
        background: '#FFFFFF',
        surface: '#F9FAFB',
        surfaceVariant: '#F3F4F6',
        
        onBackground: '#1F2937',
        onSurface: '#1F2937',
        onSurfaceVariant: '#374151',
        
        primary: '#2563EB',
        onPrimary: '#FFFFFF',
        primaryContainer: '#DBEAFE',
        onPrimaryContainer: '#1E40AF',
        
        secondary: '#D97706',
        onSecondary: '#FFFFFF',
        secondaryContainer: '#FEF3C7',
        onSecondaryContainer: '#92400E',
        
        error: '#DC2626',
        onError: '#FFFFFF',
        errorContainer: '#FEE2E2',
        onErrorContainer: '#991B1B',
        
        success: '#059669',
        onSuccess: '#FFFFFF',
        successContainer: '#D1FAE5',
        onSuccessContainer: '#065F46',
        
        warning: '#D97706',
        onWarning: '#FFFFFF',
        warningContainer: '#FEF3C7',
        onWarningContainer: '#92400E',
        
        outline: '#D1D5DB',
        outlineVariant: '#E5E7EB',
        
        disabled: '#D1D5DB',
        onDisabled: '#9CA3AF',
        
        focus: '#2563EB',
        focusRing: '#93C5FD',
      },
      typography: {
        fontWeights: {
          normal: '500',
          medium: '600',
          semibold: '700',
          bold: '800',
        },
        fontSizes: {
          small: 16,
          medium: 18,
          large: 20,
          xlarge: 24,
        },
      },
      spacing: {
        minTouchTarget: 48,
        touchSpacing: 12,
      },
      borders: {
        thin: 2,
        medium: 3,
        thick: 4,
        focus: 4,
      },
    };
  }
};

interface HighContrastContextType {
  theme: HighContrastTheme;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  isDarkMode: boolean;
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined);

interface HighContrastProviderProps {
  children: ReactNode;
}

export const HighContrastProvider: React.FC<HighContrastProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Listen for system color scheme changes
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  useEffect(() => {
    // Check if user has accessibility preferences for high contrast
    const checkAccessibilityPreferences = async () => {
      try {
        const accessibilityManager = AccessibilityManager.getInstance();
        const shouldUseHighContrast = accessibilityManager.shouldUseHighContrast();
        setIsHighContrast(shouldUseHighContrast);
      } catch (error) {
        console.warn('Failed to check accessibility preferences:', error);
      }
    };

    checkAccessibilityPreferences();
  }, []);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    
    // Announce the change to screen readers
    const accessibilityManager = AccessibilityManager.getInstance();
    accessibilityManager.announceForScreenReader(
      `High contrast mode ${!isHighContrast ? 'enabled' : 'disabled'}`,
      'high'
    );
  };

  const theme = isHighContrast 
    ? createHighContrastTheme(isDarkMode)
    : createStandardTheme(isDarkMode);

  const contextValue: HighContrastContextType = {
    theme,
    isHighContrast,
    toggleHighContrast,
    isDarkMode,
  };

  return (
    <HighContrastContext.Provider value={contextValue}>
      {children}
    </HighContrastContext.Provider>
  );
};

export const useHighContrast = (): HighContrastContextType => {
  const context = useContext(HighContrastContext);
  if (context === undefined) {
    throw new Error('useHighContrast must be used within a HighContrastProvider');
  }
  return context;
};

export default HighContrastProvider;