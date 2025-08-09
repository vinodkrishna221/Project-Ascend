import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useAccessibility, AccessibilityUtils, AccessibilityHelpers } from '../../utils/accessibility';
import { useHighContrast } from '../../components/accessibility/HighContrastProvider';
import { KeyboardNavigation, Focusable } from '../../components/accessibility/KeyboardNavigation';
import { StackScreenProps } from '@react-navigation/stack';

// Define the navigation param list
type RootStackParamList = {
  Welcome: undefined;
  EmailVerification: { role: 'student' | 'aspirant' };
  CollegeSelection: { role: 'student' | 'aspirant' };
  CollegeCredentials: { 
    role: 'student' | 'aspirant';
    college: {
      id: string;
      name: string;
      location: string;
      providesEmail: boolean;
      verificationMethod: 'email' | 'database' | 'manual';
    };
  };
  VerificationSuccess: { 
    role: 'student' | 'aspirant';
    email?: string;
    college?: any;
    verificationMethod: 'email' | 'database';
    studentData?: any;
  };
};

type WelcomeScreenProps = StackScreenProps<RootStackParamList, 'Welcome'>;

type UserRole = 'student' | 'aspirant';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation, route }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const accessibility = useAccessibility();
  const { theme } = useHighContrast();

  useEffect(() => {
    // Announce page load for screen readers
    accessibility.announcePageChange(
      'Welcome to Ascend',
      'Choose your role to get started with verification'
    );
  }, [accessibility]);

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    // Announce selection to screen readers
    const roleLabel = role === 'student' ? 'Student' : 'College Aspirant';
    accessibility.announceForScreenReader(`${roleLabel} role selected`);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigation.navigate('EmailVerification', { role: selectedRole });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardNavigation enabled={true} autoFocus={true}>
        <Animatable.View 
          animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
          duration={AccessibilityUtils.getAnimationDuration(800)} 
          style={styles.content}
        >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Animatable.View
            animation="bounceIn"
            delay={300}
            style={[styles.illustration, styles.placeholderIllustration]}
          >
            <Text style={styles.placeholderText}>🎓</Text>
            <Text style={styles.placeholderSubtext}>Welcome Illustration</Text>
          </Animatable.View>
          <Text 
            style={[styles.title, { 
              color: theme.colors.onBackground,
              fontSize: theme.typography.fontSizes.xlarge + 4
            }]}
            {...AccessibilityHelpers.getHeadingProps(1, 'Welcome to Ascend')}
          >
            Welcome to Ascend
          </Text>
          <Text style={[styles.subtitle, { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.typography.fontSizes.medium
          }]}>
            Your student community awaits! Let's get you verified and connected.
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSelection}>
          <Text style={[styles.roleTitle, { 
            color: theme.colors.onSurface,
            fontSize: theme.typography.fontSizes.large,
            fontWeight: theme.typography.fontWeights.semibold
          }]}>
            I am a:
          </Text>
          
          <Focusable id="student-role" order={1}>
            <TouchableOpacity
              style={[
                styles.roleCard,
                { 
                  backgroundColor: selectedRole === 'student' ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: selectedRole === 'student' ? theme.colors.primary : theme.colors.outline,
                  borderWidth: theme.borders.medium,
                  minHeight: theme.spacing.minTouchTarget
                }
              ]}
              onPress={() => handleRoleSelection('student')}
              {...AccessibilityHelpers.getButtonProps(
                'Select Current Student role',
                'Choose this if you are currently enrolled in college',
                false,
                selectedRole === 'student'
              )}
              accessibilityState={{ selected: selectedRole === 'student' }}
            >
            <View style={styles.roleIcon}>
              <Text style={styles.roleEmoji}>🎓</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleLabel, { 
                color: selectedRole === 'student' ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                fontSize: theme.typography.fontSizes.medium,
                fontWeight: theme.typography.fontWeights.semibold
              }]}>
                Current Student
              </Text>
              <Text style={[styles.roleDescription, { 
                color: selectedRole === 'student' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                fontSize: theme.typography.fontSizes.small
              }]}>
                I'm currently enrolled in college and have access to my college email
              </Text>
            </View>
            {selectedRole === 'student' && (
              <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.checkmarkText, { color: theme.colors.onPrimary }]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          </Focusable>

          <Focusable id="aspirant-role" order={2}>
            <TouchableOpacity
              style={[
                styles.roleCard,
                { 
                  backgroundColor: selectedRole === 'aspirant' ? theme.colors.primaryContainer : theme.colors.surface,
                  borderColor: selectedRole === 'aspirant' ? theme.colors.primary : theme.colors.outline,
                  borderWidth: theme.borders.medium,
                  minHeight: theme.spacing.minTouchTarget
                }
              ]}
              onPress={() => handleRoleSelection('aspirant')}
              {...AccessibilityHelpers.getButtonProps(
                'Select College Aspirant role',
                'Choose this if you are planning to join college',
                false,
                selectedRole === 'aspirant'
              )}
              accessibilityState={{ selected: selectedRole === 'aspirant' }}
            >
            <View style={styles.roleIcon}>
              <Text style={styles.roleEmoji}>🌟</Text>
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleLabel, { 
                color: selectedRole === 'aspirant' ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                fontSize: theme.typography.fontSizes.medium,
                fontWeight: theme.typography.fontWeights.semibold
              }]}>
                College Aspirant
              </Text>
              <Text style={[styles.roleDescription, { 
                color: selectedRole === 'aspirant' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                fontSize: theme.typography.fontSizes.small
              }]}>
                I'm planning to join college and want to connect with current students
              </Text>
            </View>
            {selectedRole === 'aspirant' && (
              <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.checkmarkText, { color: theme.colors.onPrimary }]}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          </Focusable>
        </View>

        {/* Continue Button */}
        <Animatable.View
          animation={selectedRole ? "bounceIn" : undefined}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedRole && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!selectedRole}
            accessibilityRole="button"
            accessibilityLabel="Continue with selected role"
            accessibilityHint="Proceed to email verification"
            accessibilityState={{ disabled: !selectedRole }}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedRole && styles.continueButtonTextDisabled
            ]}>
              Continue
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Help Text */}
        <Text style={styles.helpText}>
          You can change this later in your profile settings
        </Text>
      </Animatable.View>
      </KeyboardNavigation>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustration: {
    width: width * 0.6,
    height: 200,
    marginBottom: 24,
  },
  placeholderIllustration: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  roleSelection: {
    marginBottom: 40,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  roleCardSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2563EB',
  },
  roleIcon: {
    marginRight: 16,
  },
  roleEmoji: {
    fontSize: 32,
  },
  roleInfo: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
  helpText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default WelcomeScreen;