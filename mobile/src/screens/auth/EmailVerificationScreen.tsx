import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useAccessibility, AccessibilityUtils, AccessibilityHelpers } from '../../utils/accessibility';
import { useHighContrast } from '../../components/accessibility/HighContrastProvider';
import { KeyboardNavigation, Focusable } from '../../components/accessibility/KeyboardNavigation';
import TimeExtension from '../../components/accessibility/TimeExtension';
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

type EmailVerificationScreenProps = StackScreenProps<RootStackParamList, 'EmailVerification'>;

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { role } = route.params;
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const emailInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);
  const accessibility = useAccessibility();
  const { theme } = useHighContrast();

  useEffect(() => {
    // Announce page load for screen readers
    accessibility.announcePageChange(
      'Email Verification',
      isEmailSent 
        ? 'Enter the verification code sent to your email'
        : 'Enter your college email address to receive a verification code'
    );
  }, [accessibility, isEmailSent]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, canResend]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isCollegeEmail = (email: string): boolean => {
    // Common college domain patterns
    const collegeDomains = ['.edu', '.ac.', '.edu.'];
    return collegeDomains.some(domain => email.toLowerCase().includes(domain));
  };

  const handleSendVerificationCode = async () => {
    if (!validateEmail(email)) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.',
        [{ text: 'OK', onPress: () => emailInputRef.current?.focus() }]
      );
      return;
    }

    if (!isCollegeEmail(email)) {
      Alert.alert(
        'College Email Required',
        'Please use your college email address to verify your student status.',
        [
          { text: 'Try Again', onPress: () => emailInputRef.current?.focus() },
          { 
            text: 'No College Email?', 
            onPress: () => navigation.navigate('CollegeSelection', { role })
          }
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      // API call to send verification code
      const response = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEmailSent(true);
        setTimeRemaining(900); // 15 minutes
        setCanResend(false);
        
        accessibility.announceSuccess(
          'Verification code sent to your email. Please check your inbox and enter the code.'
        );
        
        // Focus on code input after a short delay
        setTimeout(() => {
          codeInputRef.current?.focus();
        }, 500);
      } else {
        if (data.error.code === 'UNSUPPORTED_DOMAIN') {
          Alert.alert(
            'College Not Supported',
            'Your college domain is not yet supported. Would you like to request it or try database verification?',
            [
              { text: 'Request Domain', onPress: () => {/* Handle domain request */} },
              { 
                text: 'Database Verification', 
                onPress: () => navigation.navigate('CollegeSelection', { role })
              }
            ]
          );
        } else {
          Alert.alert('Error', data.error.message);
        }
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: handleSendVerificationCode }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert(
        'Invalid Code',
        'Please enter the complete 6-digit verification code.',
        [{ text: 'OK', onPress: () => codeInputRef.current?.focus() }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (data.success) {
        accessibility.announceSuccess('Verification successful!');
        navigation.navigate('VerificationSuccess', { 
          role,
          email,
          verificationMethod: 'email'
        });
      } else {
        setAttemptsRemaining(prev => prev - 1);
        
        if (attemptsRemaining <= 1) {
          Alert.alert(
            'Too Many Attempts',
            'You have exceeded the maximum number of attempts. Please try again in 1 hour or contact support.',
            [
              { text: 'Contact Support', onPress: () => {/* Handle support contact */} },
              { text: 'OK' }
            ]
          );
        } else {
          Alert.alert(
            'Invalid Code',
            `The verification code is incorrect. You have ${attemptsRemaining - 1} attempts remaining.`,
            [{ text: 'Try Again', onPress: () => codeInputRef.current?.focus() }]
          );
        }
        
        setVerificationCode('');
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: handleVerifyCode }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setTimeRemaining(60); // 1 minute cooldown for resend
    
    try {
      const response = await fetch('/api/v1/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        accessibility.announceSuccess('New verification code sent to your email.');
        Alert.alert(
          'Code Sent',
          'A new verification code has been sent to your email.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', data.error.message);
        setCanResend(true);
        setTimeRemaining(0);
      }
    } catch (error) {
      Alert.alert('Network Error', 'Failed to resend code. Please try again.');
      setCanResend(true);
      setTimeRemaining(0);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUp = () => {
    Alert.alert(
      'Time Expired',
      'The verification session has expired. Please start over.',
      [
        { text: 'Start Over', onPress: () => navigation.goBack() },
        { text: 'Contact Support', onPress: () => {/* Handle support contact */} }
      ]
    );
  };

  const handleTimeExtension = (newTime: number) => {
    accessibility.announceForScreenReader(
      `Time extended. You now have ${Math.floor(newTime / 60)} minutes remaining.`,
      'high'
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardNavigation enabled={true} autoFocus={!isEmailSent}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <Animatable.View 
            animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
            duration={AccessibilityUtils.getAnimationDuration(600)} 
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text 
                style={[styles.title, { 
                  color: theme.colors.onBackground,
                  fontSize: theme.typography.fontSizes.xlarge
                }]}
                {...AccessibilityHelpers.getHeadingProps(1, isEmailSent ? 'Check Your Email' : 'Verify Your College Email')}
              >
                {isEmailSent ? 'Check Your Email' : 'Verify Your College Email'}
              </Text>
              <Text style={[styles.subtitle, { 
                color: theme.colors.onSurfaceVariant,
                fontSize: theme.typography.fontSizes.medium
              }]}>
                {isEmailSent 
                  ? `We've sent a 6-digit code to ${email}. Enter it below to verify your account.`
                  : `Enter your college email address to get started. This helps us maintain a student-only community.`
                }
              </Text>
            </View>

            {/* Time Extension Component */}
            {isEmailSent && timeRemaining > 0 && (
              <TimeExtension
                initialTime={timeRemaining}
                onTimeUp={handleTimeUp}
                onExtensionGranted={handleTimeExtension}
                allowExtensions={true}
                maxExtensions={2}
                extensionDuration={300} // 5 minutes
                warningThreshold={60} // 1 minute
                context="email verification"
              />
            )}

            {/* Email Input */}
            {!isEmailSent && (
              <Focusable id="email-input" order={1}>
                <Animatable.View 
                  animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                  delay={AccessibilityUtils.getAnimationDuration(200)} 
                  style={styles.inputContainer}
                >
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.onSurface,
                    fontSize: theme.typography.fontSizes.medium,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    College Email Address
                  </Text>
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.textInput, { 
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      minHeight: theme.spacing.minTouchTarget
                    }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.name@college.edu"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    {...AccessibilityHelpers.getInputProps(
                      'College email address',
                      'Enter your college email address for verification',
                      undefined,
                      true
                    )}
                  />
                  <Text style={[styles.inputHint, { 
                    color: theme.colors.onSurfaceVariant,
                    fontSize: theme.typography.fontSizes.small
                  }]}>
                    Use your official college email address (usually ends with .edu or .ac)
                  </Text>
                </Animatable.View>
              </Focusable>
            )}

            {/* Verification Code Input */}
            {isEmailSent && (
              <Focusable id="code-input" order={2}>
                <Animatable.View 
                  animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                  delay={AccessibilityUtils.getAnimationDuration(200)} 
                  style={styles.inputContainer}
                >
                  <Text style={[styles.inputLabel, { 
                    color: theme.colors.onSurface,
                    fontSize: theme.typography.fontSizes.medium,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    Verification Code
                  </Text>
                  <TextInput
                    ref={codeInputRef}
                    style={[
                      styles.textInput, 
                      styles.codeInput,
                      { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.xlarge,
                        minHeight: theme.spacing.minTouchTarget
                      }
                    ]}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="000000"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="one-time-code"
                    {...AccessibilityHelpers.getInputProps(
                      'Verification code',
                      'Enter the 6-digit code sent to your email',
                      attemptsRemaining < 3 ? `${attemptsRemaining} attempts remaining` : undefined,
                      true
                    )}
                  />
                  
                  {attemptsRemaining < 3 && (
                    <Text 
                      style={[styles.attemptsText, { 
                        color: theme.colors.error,
                        fontSize: theme.typography.fontSizes.small
                      }]}
                      {...AccessibilityHelpers.getAlertProps(
                        `${attemptsRemaining} attempts remaining`,
                        'warning'
                      )}
                    >
                      {attemptsRemaining} attempts remaining
                    </Text>
                  )}
                </Animatable.View>
              </Focusable>
            )}

            {/* Action Button */}
            <Focusable id="action-button" order={3}>
              <Animatable.View 
                animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                delay={AccessibilityUtils.getAnimationDuration(400)} 
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { 
                      backgroundColor: (isLoading || (!isEmailSent && !email.trim()) || (isEmailSent && verificationCode.length !== 6)) 
                        ? theme.colors.disabled 
                        : theme.colors.primary,
                      minHeight: theme.spacing.minTouchTarget
                    }
                  ]}
                  onPress={isEmailSent ? handleVerifyCode : handleSendVerificationCode}
                  disabled={isLoading || (!isEmailSent && !email.trim()) || (isEmailSent && verificationCode.length !== 6)}
                  {...AccessibilityHelpers.getButtonProps(
                    isEmailSent ? 'Verify code' : 'Send verification code',
                    isEmailSent ? 'Submit the verification code to complete verification' : 'Send verification code to your email address',
                    isLoading || (!isEmailSent && !email.trim()) || (isEmailSent && verificationCode.length !== 6)
                  )}
                >
                  <Text style={[
                    styles.actionButtonText,
                    { 
                      color: (isLoading || (!isEmailSent && !email.trim()) || (isEmailSent && verificationCode.length !== 6))
                        ? theme.colors.onDisabled
                        : theme.colors.onPrimary,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }
                  ]}>
                    {isLoading 
                      ? (isEmailSent ? 'Verifying...' : 'Sending...') 
                      : (isEmailSent ? 'Verify Code' : 'Send Verification Code')
                    }
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </Focusable>

            {/* Resend Code */}
            {isEmailSent && (
              <Focusable id="resend-button" order={4} disabled={!canResend}>
                <Animatable.View 
                  animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                  delay={AccessibilityUtils.getAnimationDuration(600)} 
                  style={styles.resendContainer}
                >
                  <Text style={[styles.resendText, { 
                    color: theme.colors.onSurfaceVariant,
                    fontSize: theme.typography.fontSizes.small
                  }]}>
                    Didn't receive the code?
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={!canResend}
                    style={{ minHeight: theme.spacing.minTouchTarget, justifyContent: 'center' }}
                    {...AccessibilityHelpers.getButtonProps(
                      'Resend verification code',
                      canResend ? 'Send a new verification code to your email' : `Wait ${timeRemaining} seconds before requesting a new code`,
                      !canResend
                    )}
                  >
                    <Text style={[
                      styles.resendButton,
                      { 
                        color: canResend ? theme.colors.primary : theme.colors.disabled,
                        fontSize: theme.typography.fontSizes.small,
                        fontWeight: theme.typography.fontWeights.semibold
                      }
                    ]}>
                      {canResend ? 'Resend Code' : `Resend in ${timeRemaining}s`}
                    </Text>
                  </TouchableOpacity>
                </Animatable.View>
              </Focusable>
            )}

            {/* Alternative Options */}
            <Focusable id="alternative-button" order={5}>
              <Animatable.View 
                animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                delay={AccessibilityUtils.getAnimationDuration(800)} 
                style={styles.alternativeContainer}
              >
                <Text style={[styles.alternativeText, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: theme.typography.fontSizes.small
                }]}>
                  Don't have a college email?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CollegeSelection', { role })}
                  style={{ minHeight: theme.spacing.minTouchTarget, justifyContent: 'center' }}
                  {...AccessibilityHelpers.getButtonProps(
                    'Try database verification',
                    'Use college database verification instead of email verification'
                  )}
                >
                  <Text style={[styles.alternativeButton, { 
                    color: theme.colors.primary,
                    fontSize: theme.typography.fontSizes.small,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    Try Database Verification
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </Focusable>
          </Animatable.View>
        </KeyboardAvoidingView>
      </KeyboardNavigation>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  attemptsText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  actionButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  resendButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#9CA3AF',
  },
  alternativeContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  alternativeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  alternativeButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default EmailVerificationScreen;