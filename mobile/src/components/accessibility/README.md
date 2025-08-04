# Accessibility Components for Mobile Authentication Flow

This directory contains comprehensive accessibility components and utilities that ensure the mobile authentication flow is fully accessible to users with disabilities and follows inclusive design principles.

## Components Overview

### 1. HighContrastProvider
Provides high contrast themes for users with visual impairments.

**Features:**
- Automatic detection of system accessibility preferences
- Manual toggle for high contrast mode
- Enhanced color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Increased font weights and sizes for better readability
- Larger touch targets (48px minimum)
- Enhanced border widths for better visibility

**Usage:**
```tsx
import { HighContrastProvider, useHighContrast } from './HighContrastProvider';

// Wrap your app
<HighContrastProvider>
  <App />
</HighContrastProvider>

// Use in components
const { theme, isHighContrast, toggleHighContrast } = useHighContrast();
```

### 2. KeyboardNavigation
Provides keyboard navigation support for external keyboards and assistive technologies.

**Features:**
- Tab order management with custom ordering
- Focus trapping for modals and forms
- Skip links for quick navigation
- Automatic focus management
- Screen reader announcements for focus changes

**Usage:**
```tsx
import { KeyboardNavigation, Focusable, FocusTrap } from './KeyboardNavigation';

<KeyboardNavigation enabled={true} autoFocus={true}>
  <Focusable id="input-1" order={1}>
    <TextInput />
  </Focusable>
  <Focusable id="button-1" order={2}>
    <Button />
  </Focusable>
</KeyboardNavigation>
```

### 3. TimeExtension
Provides time extension options for time-sensitive verification steps.

**Features:**
- Automatic warnings before time expires
- Extension request modal with clear options
- Screen reader announcements for time changes
- Pause/resume controls for screen reader users
- Customizable extension limits and durations

**Usage:**
```tsx
import TimeExtension from './TimeExtension';

<TimeExtension
  initialTime={900} // 15 minutes
  onTimeUp={handleTimeUp}
  onExtensionGranted={handleExtension}
  allowExtensions={true}
  maxExtensions={2}
  extensionDuration={300} // 5 minutes
  warningThreshold={60} // 1 minute warning
  context="email verification"
/>
```

## Accessibility Utilities

### AccessibilityManager
Central manager for accessibility state and preferences.

**Features:**
- Screen reader detection and state management
- Reduced motion preference detection
- Extended timeout calculations for screen reader users
- Centralized announcement system
- Event listener management

### AccessibilityHelpers
Helper functions for generating accessibility props.

**Available Helpers:**
- `getInputProps()` - Form input accessibility props
- `getButtonProps()` - Button accessibility props
- `getProgressProps()` - Progress indicator props
- `getTabProps()` - Tab navigation props
- `getAlertProps()` - Alert/notification props
- `getHeadingProps()` - Heading hierarchy props

### AccessibilityUtils
Utility functions for accessibility-related calculations and formatting.

**Available Utils:**
- `getAnimationDuration()` - Respects reduced motion preferences
- `formatForScreenReader()` - Formats text for better screen reader pronunciation
- `createDescription()` - Creates descriptive text for complex UI elements
- `meetsContrastRequirement()` - Checks color contrast ratios

## Implementation in Authentication Screens

### WelcomeScreen
- **Screen Reader Support**: Page announcements, role selection announcements
- **Keyboard Navigation**: Tab order for role selection buttons
- **High Contrast**: Theme-aware colors and enhanced visibility
- **Touch Targets**: Minimum 48px touch targets for all interactive elements

### EmailVerificationScreen
- **Screen Reader Support**: Form field announcements, error announcements, success announcements
- **Keyboard Navigation**: Logical tab order through form fields
- **Time Extension**: Built-in time extension for verification code entry
- **High Contrast**: Enhanced form field visibility and error states

### CollegeSelectionScreen
- **Screen Reader Support**: Search announcements, selection announcements
- **Keyboard Navigation**: Searchable list with proper focus management
- **High Contrast**: Enhanced list item visibility and selection states
- **Touch Targets**: Large touch targets for college selection items

### CollegeCredentialsScreen
- **Screen Reader Support**: Form validation announcements, field descriptions
- **Keyboard Navigation**: Sequential form field navigation
- **High Contrast**: Clear form field boundaries and error states
- **Touch Targets**: Accessible form controls and buttons

### VerificationSuccessScreen
- **Screen Reader Support**: Success announcements, progress announcements
- **Keyboard Navigation**: Navigation through onboarding steps
- **High Contrast**: Celebration animations respect reduced motion preferences
- **Touch Targets**: Large navigation buttons

## Accessibility Standards Compliance

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44px (48px in high contrast mode)
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels, roles, and announcements
- **Reduced Motion**: Respects user's motion preferences

### Platform-Specific Features
- **iOS**: VoiceOver support, Dynamic Type support, Reduce Motion support
- **Android**: TalkBack support, font scaling support, animation preferences

## Testing

### Automated Testing
- Unit tests for all accessibility utilities
- Integration tests for component interactions
- Screen reader simulation tests
- Keyboard navigation tests

### Manual Testing Checklist
- [ ] Screen reader navigation (VoiceOver/TalkBack)
- [ ] Keyboard-only navigation
- [ ] High contrast mode functionality
- [ ] Reduced motion preferences
- [ ] Touch target sizes
- [ ] Color contrast ratios
- [ ] Time extension functionality

### Testing Commands
```bash
# Run accessibility tests
npm test -- --testPathPattern=accessibility

# Run with coverage
npm test -- --coverage --testPathPattern=accessibility
```

## Best Practices

### Screen Reader Support
1. Always provide meaningful labels and hints
2. Announce important state changes
3. Use proper heading hierarchy
4. Provide context for complex interactions

### Keyboard Navigation
1. Maintain logical tab order
2. Provide visible focus indicators
3. Support standard keyboard shortcuts
4. Implement focus trapping for modals

### High Contrast Support
1. Use theme-aware colors throughout
2. Provide sufficient color contrast
3. Don't rely solely on color for information
4. Test with actual high contrast modes

### Time-Sensitive Content
1. Always provide extension options
2. Give adequate warnings before expiration
3. Provide pause/resume controls for screen readers
4. Allow reasonable time limits

## Future Enhancements

### Planned Features
- Voice input support for form fields
- Gesture-based navigation alternatives
- Customizable font sizes beyond system settings
- Enhanced haptic feedback patterns
- Multi-language screen reader support

### Accessibility Roadmap
1. **Phase 1**: Core accessibility features (✅ Complete)
2. **Phase 2**: Advanced voice controls
3. **Phase 3**: AI-powered accessibility assistance
4. **Phase 4**: Personalized accessibility profiles

## Resources

### Documentation
- [React Native Accessibility Guide](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Accessibility Guidelines](https://developer.apple.com/accessibility/)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)

### Testing Tools
- [Accessibility Inspector (iOS)](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html)
- [Accessibility Scanner (Android)](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)
- [axe-core for React Native](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react-native)

## Support

For accessibility-related questions or issues:
1. Check the test files for usage examples
2. Review the component documentation
3. Test with actual assistive technologies
4. Follow WCAG 2.1 AA guidelines

Remember: Accessibility is not a feature to be added later—it's a fundamental requirement that should be considered from the beginning of development.