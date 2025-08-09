import React, { useState, useRef, useEffect } from 'react';
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
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useAccessibility, AccessibilityUtils, AccessibilityHelpers } from '../../utils/accessibility';
import { useHighContrast } from '../../components/accessibility/HighContrastProvider';
import { KeyboardNavigation, Focusable } from '../../components/accessibility/KeyboardNavigation';
import { StackScreenProps } from '@react-navigation/stack';

interface College {
  id: string;
  name: string;
  location: string;
  providesEmail: boolean;
  verificationMethod: 'email' | 'database' | 'manual';
}

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

type CollegeCredentialsScreenProps = StackScreenProps<RootStackParamList, 'CollegeCredentials'>;

const CollegeCredentialsScreen: React.FC<CollegeCredentialsScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { role, college } = route.params;
  const [studentName, setStudentName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const branchInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);
  const rollInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const accessibility = useAccessibility();
  const { theme } = useHighContrast();

  useEffect(() => {
    // Announce page load for screen readers
    accessibility.announcePageChange(
      'College Credentials Verification',
      `Enter your details as registered with ${college.name} for verification`
    );
  }, [accessibility, college.name]);

  const validateForm = (): boolean => {
    if (!studentName.trim()) {
      Alert.alert(
        'Name Required',
        'Please enter your full name as registered in college.',
        [{ text: 'OK', onPress: () => nameInputRef.current?.focus() }]
      );
      return false;
    }

    if (!branch.trim()) {
      Alert.alert(
        'Branch Required',
        'Please enter your branch/department.',
        [{ text: 'OK', onPress: () => branchInputRef.current?.focus() }]
      );
      return false;
    }

    if (!year.trim() || isNaN(Number(year)) || Number(year) < 2020 || Number(year) > 2030) {
      Alert.alert(
        'Invalid Year',
        'Please enter a valid graduation year (2020-2030).',
        [{ text: 'OK', onPress: () => yearInputRef.current?.focus() }]
      );
      return false;
    }

    if (!verificationPassword.trim()) {
      Alert.alert(
        'Password Required',
        'Please enter the verification password provided by your college.',
        [{ text: 'OK', onPress: () => passwordInputRef.current?.focus() }]
      );
      return false;
    }

    return true;
  };

  const handleVerifyCredentials = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/verify-college-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collegeId: college.id,
          studentName: studentName.trim(),
          branch: branch.trim(),
          year: Number(year),
          rollNumber: rollNumber.trim() || undefined,
          verificationPassword: verificationPassword.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        accessibility.announceSuccess('Credentials verified successfully!');
        navigation.navigate('VerificationSuccess', {
          role,
          college,
          verificationMethod: 'database',
          studentData: {
            name: studentName,
            branch,
            year: Number(year),
            rollNumber: rollNumber || undefined,
          },
        });
      } else {
        let errorMessage = 'Verification failed. Please check your credentials.';
        let errorTitle = 'Verification Failed';

        switch (data.error.code) {
          case 'STUDENT_NOT_FOUND':
            errorMessage = 'Your details were not found in the college database. Please check your information or contact your college administration.';
            errorTitle = 'Student Not Found';
            break;
          case 'INVALID_PASSWORD':
            errorMessage = 'The verification password is incorrect. Please check with your college administration for the correct password.';
            errorTitle = 'Invalid Password';
            break;
          case 'CREDENTIALS_ALREADY_USED':
            errorMessage = 'These credentials have already been used to create an account. Each student can only create one account.';
            errorTitle = 'Account Already Exists';
            break;
          case 'STUDENT_RECORD_EXPIRED':
            errorMessage = 'Your student record has expired. This usually happens after graduation. Please contact support if you believe this is an error.';
            errorTitle = 'Record Expired';
            break;
        }

        Alert.alert(
          errorTitle,
          errorMessage,
          [
            { text: 'Contact Support', onPress: () => {/* Handle support contact */} },
            { text: 'Try Again' }
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: handleVerifyCredentials }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = studentName.trim() && branch.trim() && year.trim() && verificationPassword.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardNavigation enabled={true} autoFocus={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
                  {...AccessibilityHelpers.getHeadingProps(1, 'Verify Your Credentials')}
                >
                  Verify Your Credentials
                </Text>
                <Text style={[styles.subtitle, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: theme.typography.fontSizes.medium
                }]}>
                  Enter your details as registered with {college.name}. This information will be verified against the college database.
                </Text>
              </View>

              {/* College Info */}
              <Animatable.View 
                animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                delay={AccessibilityUtils.getAnimationDuration(200)} 
                style={styles.collegeInfo}
              >
                <Text style={[styles.collegeLabel, { 
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.fontSizes.small,
                  fontWeight: theme.typography.fontWeights.semibold
                }]}>
                  Selected College
                </Text>
                <View style={[styles.collegeCard, { 
                  backgroundColor: theme.colors.surfaceVariant,
                  borderLeftColor: theme.colors.primary
                }]}>
                  <Text style={[styles.collegeName, { 
                    color: theme.colors.onSurface,
                    fontSize: theme.typography.fontSizes.medium,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    {college.name}
                  </Text>
                  <Text style={[styles.collegeLocation, { 
                    color: theme.colors.onSurfaceVariant,
                    fontSize: theme.typography.fontSizes.small
                  }]}>
                    {college.location}
                  </Text>
                </View>
              </Animatable.View>

              {/* Form Fields */}
              <Animatable.View 
                animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                delay={AccessibilityUtils.getAnimationDuration(400)} 
                style={styles.formContainer}
              >
                {/* Student Name */}
                <Focusable id="name-input" order={1}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { 
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Full Name *
                    </Text>
                    <TextInput
                      ref={nameInputRef}
                      style={[styles.textInput, { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.medium,
                        minHeight: theme.spacing.minTouchTarget
                      }]}
                      value={studentName}
                      onChangeText={setStudentName}
                      placeholder="Enter your full name as in college records"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => branchInputRef.current?.focus()}
                      {...AccessibilityHelpers.getInputProps(
                        'Full name',
                        'Enter your full name as registered in college',
                        undefined,
                        true
                      )}
                    />
                  </View>
                </Focusable>

                {/* Branch/Department */}
                <Focusable id="branch-input" order={2}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { 
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Branch/Department *
                    </Text>
                    <TextInput
                      ref={branchInputRef}
                      style={[styles.textInput, { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.medium,
                        minHeight: theme.spacing.minTouchTarget
                      }]}
                      value={branch}
                      onChangeText={setBranch}
                      placeholder="e.g., Computer Science, Mechanical Engineering"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => yearInputRef.current?.focus()}
                      {...AccessibilityHelpers.getInputProps(
                        'Branch or department',
                        'Enter your branch or department name',
                        undefined,
                        true
                      )}
                    />
                  </View>
                </Focusable>

                {/* Graduation Year */}
                <Focusable id="year-input" order={3}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { 
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Graduation Year *
                    </Text>
                    <TextInput
                      ref={yearInputRef}
                      style={[styles.textInput, { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.medium,
                        minHeight: theme.spacing.minTouchTarget
                      }]}
                      value={year}
                      onChangeText={setYear}
                      placeholder="e.g., 2024"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      keyboardType="number-pad"
                      maxLength={4}
                      returnKeyType="next"
                      onSubmitEditing={() => rollInputRef.current?.focus()}
                      {...AccessibilityHelpers.getInputProps(
                        'Graduation year',
                        'Enter your expected graduation year',
                        undefined,
                        true
                      )}
                    />
                  </View>
                </Focusable>

                {/* Roll Number (Optional) */}
                <Focusable id="roll-input" order={4}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { 
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Roll Number (Optional)
                    </Text>
                    <TextInput
                      ref={rollInputRef}
                      style={[styles.textInput, { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.medium,
                        minHeight: theme.spacing.minTouchTarget
                      }]}
                      value={rollNumber}
                      onChangeText={setRollNumber}
                      placeholder="Enter your roll number if available"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      {...AccessibilityHelpers.getInputProps(
                        'Roll number',
                        'Enter your roll number if you have one'
                      )}
                    />
                  </View>
                </Focusable>

                {/* Verification Password */}
                <Focusable id="password-input" order={5}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { 
                      color: theme.colors.onSurface,
                      fontSize: theme.typography.fontSizes.medium,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Verification Password *
                    </Text>
                    <TextInput
                      ref={passwordInputRef}
                      style={[styles.textInput, { 
                        borderColor: theme.colors.outline,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.onSurface,
                        fontSize: theme.typography.fontSizes.medium,
                        minHeight: theme.spacing.minTouchTarget
                      }]}
                      value={verificationPassword}
                      onChangeText={setVerificationPassword}
                      placeholder="Password provided by your college"
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleVerifyCredentials}
                      {...AccessibilityHelpers.getInputProps(
                        'Verification password',
                        'Enter the verification password provided by your college',
                        undefined,
                        true
                      )}
                    />
                    <Text style={[styles.inputHint, { 
                      color: theme.colors.onSurfaceVariant,
                      fontSize: theme.typography.fontSizes.small
                    }]}>
                      This password was provided by your college administration for student verification
                    </Text>
                  </View>
                </Focusable>
              </Animatable.View>

              {/* Verify Button */}
              <Focusable id="verify-button" order={6}>
                <Animatable.View 
                  animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                  delay={AccessibilityUtils.getAnimationDuration(600)} 
                  style={styles.buttonContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.verifyButton,
                      { 
                        backgroundColor: (!isFormValid || isLoading) ? theme.colors.disabled : theme.colors.primary,
                        minHeight: theme.spacing.minTouchTarget
                      }
                    ]}
                    onPress={handleVerifyCredentials}
                    disabled={!isFormValid || isLoading}
                    {...AccessibilityHelpers.getButtonProps(
                      'Verify credentials',
                      'Submit your credentials for verification',
                      !isFormValid || isLoading
                    )}
                  >
                    <Text style={[
                      styles.verifyButtonText,
                      { 
                        color: (!isFormValid || isLoading) ? theme.colors.onDisabled : theme.colors.onPrimary,
                        fontSize: theme.typography.fontSizes.medium,
                        fontWeight: theme.typography.fontWeights.semibold
                      }
                    ]}>
                      {isLoading ? 'Verifying...' : 'Verify Credentials'}
                    </Text>
                  </TouchableOpacity>
                </Animatable.View>
              </Focusable>

              {/* Help Section */}
              <Focusable id="help-button" order={7}>
                <Animatable.View 
                  animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
                  delay={AccessibilityUtils.getAnimationDuration(800)} 
                  style={[styles.helpContainer, { 
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outline
                  }]}
                >
                  <Text style={[styles.helpTitle, { 
                    color: theme.colors.onSurface,
                    fontSize: theme.typography.fontSizes.medium,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    Need Help?
                  </Text>
                  <Text style={[styles.helpText, { 
                    color: theme.colors.onSurfaceVariant,
                    fontSize: theme.typography.fontSizes.small
                  }]}>
                    If you don't have your verification password or your details are not found, please contact your college administration or our support team.
                  </Text>
                  <TouchableOpacity
                    style={[styles.helpButton, { 
                      backgroundColor: theme.colors.primary,
                      minHeight: theme.spacing.minTouchTarget
                    }]}
                    onPress={() => {/* Handle support contact */}}
                    {...AccessibilityHelpers.getButtonProps(
                      'Contact support',
                      'Get help with credential verification'
                    )}
                  >
                    <Text style={[styles.helpButtonText, { 
                      color: theme.colors.onPrimary,
                      fontSize: theme.typography.fontSizes.small,
                      fontWeight: theme.typography.fontWeights.semibold
                    }]}>
                      Contact Support
                    </Text>
                  </TouchableOpacity>
                </Animatable.View>
              </Focusable>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </KeyboardNavigation>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  collegeInfo: {
    marginBottom: 32,
  },
  collegeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  collegeCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  collegeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  collegeLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
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
  inputHint: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  verifyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  verifyButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonTextDisabled: {
    color: '#9CA3AF',
  },
  helpContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  helpButton: {
    backgroundColor: '#2563EB',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CollegeCredentialsScreen;