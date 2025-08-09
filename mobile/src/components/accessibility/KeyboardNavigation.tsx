import React, { useEffect, useRef, useState, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  AccessibilityInfo,
  findNodeHandle,
  Platform,
} from 'react-native';
import { AccessibilityManager } from '../../utils/accessibility';

interface KeyboardNavigationProps {
  children: ReactNode;
  enabled?: boolean;
  trapFocus?: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
}

interface FocusableElement {
  ref: React.RefObject<any>;
  id: string;
  order: number;
  disabled?: boolean;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  enabled = true,
  trapFocus = false,
  autoFocus = false,
  onEscape,
}) => {
  const containerRef = useRef<View>(null);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const accessibilityManager = AccessibilityManager.getInstance();

  useEffect(() => {
    if (!enabled) return;

    // Auto-focus first element if requested
    if (autoFocus && focusableElements.length > 0) {
      focusElement(0);
    }

    // Set up keyboard event listeners (for external keyboards on mobile)
    const handleKeyPress = (event: any) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Tab':
          event.preventDefault();
          if (event.shiftKey) {
            focusPrevious();
          } else {
            focusNext();
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          focusNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusPrevious();
          break;
        case 'Escape':
          if (onEscape) {
            onEscape();
          }
          break;
        case 'Enter':
        case ' ':
          // Let the focused element handle these
          break;
      }
    };

    // Note: React Native doesn't have direct keyboard event support
    // This would need to be implemented with a native module for full keyboard support
    // For now, we'll focus on screen reader navigation

    return () => {
      // Cleanup would go here
    };
  }, [enabled, focusableElements, currentFocusIndex, autoFocus, onEscape]);

  const registerFocusableElement = (
    ref: React.RefObject<any>,
    id: string,
    order: number,
    disabled = false
  ) => {
    setFocusableElements(prev => {
      const existing = prev.find(el => el.id === id);
      if (existing) {
        // Update existing element
        return prev.map(el => 
          el.id === id ? { ...el, ref, order, disabled } : el
        );
      } else {
        // Add new element
        return [...prev, { ref, id, order, disabled }]
          .sort((a, b) => a.order - b.order);
      }
    });
  };

  const unregisterFocusableElement = (id: string) => {
    setFocusableElements(prev => prev.filter(el => el.id !== id));
  };

  const focusElement = (index: number) => {
    const elements = focusableElements.filter(el => !el.disabled);
    if (index >= 0 && index < elements.length) {
      const element = elements[index];
      if (element.ref.current) {
        // Focus the element
        const nodeHandle = findNodeHandle(element.ref.current);
        if (nodeHandle) {
          AccessibilityInfo.setAccessibilityFocus(nodeHandle);
          setCurrentFocusIndex(index);
          
          // Announce focus change for screen readers
          accessibilityManager.announceForScreenReader(
            `Focused on ${element.id}`,
            'low'
          );
        }
      }
    }
  };

  const focusNext = () => {
    const elements = focusableElements.filter(el => !el.disabled);
    let nextIndex = currentFocusIndex + 1;
    
    if (trapFocus && nextIndex >= elements.length) {
      nextIndex = 0; // Wrap to first element
    } else if (nextIndex >= elements.length) {
      return; // Don't wrap if not trapping focus
    }
    
    focusElement(nextIndex);
  };

  const focusPrevious = () => {
    const elements = focusableElements.filter(el => !el.disabled);
    let prevIndex = currentFocusIndex - 1;
    
    if (trapFocus && prevIndex < 0) {
      prevIndex = elements.length - 1; // Wrap to last element
    } else if (prevIndex < 0) {
      return; // Don't wrap if not trapping focus
    }
    
    focusElement(prevIndex);
  };

  const focusFirst = () => {
    focusElement(0);
  };

  const focusLast = () => {
    const elements = focusableElements.filter(el => !el.disabled);
    focusElement(elements.length - 1);
  };

  return (
    <View
      ref={containerRef}
      style={styles.container}
      accessible={false} // Let children handle their own accessibility
    >
      <KeyboardNavigationContext.Provider
        value={{
          registerFocusableElement,
          unregisterFocusableElement,
          focusNext,
          focusPrevious,
          focusFirst,
          focusLast,
          currentFocusIndex,
          enabled,
        }}
      >
        {children}
      </KeyboardNavigationContext.Provider>
    </View>
  );
};

interface KeyboardNavigationContextType {
  registerFocusableElement: (
    ref: React.RefObject<any>,
    id: string,
    order: number,
    disabled?: boolean
  ) => void;
  unregisterFocusableElement: (id: string) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focusFirst: () => void;
  focusLast: () => void;
  currentFocusIndex: number;
  enabled: boolean;
}

const KeyboardNavigationContext = React.createContext<KeyboardNavigationContextType | undefined>(
  undefined
);

export const useKeyboardNavigation = () => {
  const context = React.useContext(KeyboardNavigationContext);
  if (context === undefined) {
    throw new Error('useKeyboardNavigation must be used within a KeyboardNavigation component');
  }
  return context;
};

interface FocusableProps {
  children: ReactNode;
  id: string;
  order: number;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Focusable: React.FC<FocusableProps> = ({
  children,
  id,
  order,
  disabled = false,
  onFocus,
  onBlur,
}) => {
  const ref = useRef<View>(null);
  const navigation = useKeyboardNavigation();

  useEffect(() => {
    navigation.registerFocusableElement(ref, id, order, disabled);
    
    return () => {
      navigation.unregisterFocusableElement(id);
    };
  }, [navigation, id, order, disabled]);

  const handleFocus = () => {
    onFocus?.();
  };

  const handleBlur = () => {
    onBlur?.();
  };

  return (
    <View
      ref={ref}
      style={styles.focusable}
      onAccessibilityTap={handleFocus}
      accessible={!disabled}
      accessibilityState={{ disabled }}
    >
      {children}
    </View>
  );
};

interface SkipLinkProps {
  targetId: string;
  children: ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
  const navigation = useKeyboardNavigation();
  const accessibilityManager = AccessibilityManager.getInstance();

  const handleSkip = () => {
    // Find the target element and focus it
    // This would need to be implemented based on the specific navigation system
    accessibilityManager.announceForScreenReader(
      `Skipped to ${targetId}`,
      'high'
    );
  };

  return (
    <Focusable
      id={`skip-link-${targetId}`}
      order={-1} // Skip links should be first in tab order
    >
      <View
        style={styles.skipLink}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Skip to ${targetId}`}
        accessibilityHint="Activate to skip to main content"
        onAccessibilityTap={handleSkip}
      >
        {children}
      </View>
    </Focusable>
  );
};

interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  onEscape?: () => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  onEscape,
}) => {
  return (
    <KeyboardNavigation
      enabled={active}
      trapFocus={true}
      autoFocus={active}
      onEscape={onEscape}
    >
      {children}
    </KeyboardNavigation>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  focusable: {
    // Base styles for focusable elements
  },
  skipLink: {
    position: 'absolute',
    top: -1000, // Hidden by default
    left: 0,
    backgroundColor: '#000000',
    color: '#FFFFFF',
    padding: 8,
    zIndex: 9999,
    // Would be shown when focused
  },
});

export default KeyboardNavigation;