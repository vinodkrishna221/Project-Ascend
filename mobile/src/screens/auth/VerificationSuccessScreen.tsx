import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
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

interface StudentData {
  name: string;
  branch: string;
  year: number;
  rollNumber?: string;
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

type VerificationSuccessScreenProps = StackScreenProps<RootStackParamList, 'VerificationSuccess'>;

const VerificationSuccessScreen: React.FC<VerificationSuccessScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { role, email, college, verificationMethod, studentData } = route.params;
  const [currentStep, setCurrentStep] = useState(0);
  const accessibility = useAccessibility();
  const { theme } = useHighContrast();

  const celebrationMessages = [
    "🎉 Verification Successful!",
    "✨ Welcome to Ascend!",
    "🚀 Let's get you started!"
  ];

  const onboardingSteps = [
    {
      title: "You're Verified!",
      description: role === 'student' 
        ? "Your student status has been confirmed. You now have full access to the Ascend community."
        : "Welcome to Ascend! As an aspirant, you can connect with current students and explore college communities.",
      icon: "🎓"
    },
    {
      title: "Connect & Share",
      description: role === 'student'
        ? "Share your wins, showcase projects, and celebrate achievements with fellow students across colleges."
        : "Ask questions, get authentic insights, and connect with students from colleges you're interested in.",
      icon: "🤝"
    },
    {
      title: "Build Your Network",
      description: role === 'student'
        ? "Join communities, collaborate on projects, and build meaningful connections that last beyond college."
        : "Explore college guilds, participate in Q&A sessions, and make informed decisions about your future.",
      icon: "🌟"
    }
  ];

  useEffect(() => {
    // Announce success to screen readers
    accessibility.announceSuccess(
      `Verification successful! Welcome to Ascend as a ${role}.`
    );

    // Auto-advance through celebration messages (respect reduced motion)
    if (!accessibility.shouldReduceMotion()) {
      const timer = setTimeout(() => {
        if (currentStep < celebrationMessages.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      }, accessibility.getExtendedTimeout(1500));

      return () => clearTimeout(timer);
    }
  }, [currentStep, role, accessibility]);

  const handleGetStarted = () => {
    // Navigate to main app or profile setup
    // For now, navigate back to Welcome screen as MainApp is not yet implemented
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleSkipOnboarding = () => {
    handleGetStarted();
  };

  const renderCelebration = () => (
    <Animatable.View 
      animation={accessibility.shouldReduceMotion() ? undefined : "bounceIn"} 
      duration={AccessibilityUtils.getAnimationDuration(1000)}
      style={styles.celebrationContainer}
    >
      <Animatable.Text 
        animation={accessibility.shouldReduceMotion() ? undefined : "pulse"} 
        iterationCount={accessibility.shouldReduceMotion() ? 1 : "infinite"}
        style={[styles.celebrationEmoji, { fontSize: theme.typography.fontSizes.xlarge + 40 }]}
        accessibilityLabel="Celebration"
        accessibilityRole="text"
      >
        🎉
      </Animatable.Text>
      <Animatable.Text 
        animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
        delay={AccessibilityUtils.getAnimationDuration(300)}
        style={[styles.celebrationTitle, { 
          color: theme.colors.onBackground,
          fontSize: theme.typography.fontSizes.xlarge
        }]}
        {...AccessibilityHelpers.getHeadingProps(1, celebrationMessages[currentStep])}
      >
        {celebrationMessages[currentStep]}
      </Animatable.Text>
      
      {currentStep === celebrationMessages.length - 1 && (
        <Animatable.View 
          animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
          delay={AccessibilityUtils.getAnimationDuration(600)}
        >
          <Text style={[styles.verificationDetails, { 
            color: theme.colors.onSurfaceVariant,
            fontSize: theme.typography.fontSizes.medium
          }]}>
            {verificationMethod === 'email' && email && (
              <>Verified via college email: {email}</>
            )}
            {verificationMethod === 'database' && college && (
              <>Verified via {college.name} database</>
            )}
          </Text>
        </Animatable.View>
      )}
    </Animatable.View>
  );

  const renderOnboarding = () => {
    if (currentStep < celebrationMessages.length) return null;

    const stepIndex = currentStep - celebrationMessages.length;
    const step = onboardingSteps[stepIndex];

    if (!step) return null;

    return (
      <Animatable.View 
        animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
        duration={AccessibilityUtils.getAnimationDuration(800)}
        style={styles.onboardingContainer}
      >
        <Text 
          style={[styles.onboardingIcon, { fontSize: theme.typography.fontSizes.xlarge + 20 }]}
          accessibilityLabel={`Step icon: ${step.icon}`}
        >
          {step.icon}
        </Text>
        <Text 
          style={[styles.onboardingTitle, { 
            color: theme.colors.onBackground,
            fontSize: theme.typography.fontSizes.xlarge
          }]}
          {...AccessibilityHelpers.getHeadingProps(2, step.title)}
        >
          {step.title}
        </Text>
        <Text style={[styles.onboardingDescription, { 
          color: theme.colors.onSurfaceVariant,
          fontSize: theme.typography.fontSizes.medium
        }]}>
          {step.description}
        </Text>
        
        {/* Progress Indicators */}
        <View 
          style={styles.progressContainer}
          {...AccessibilityHelpers.getProgressProps(stepIndex + 1, onboardingSteps.length, 'Onboarding progress')}
        >
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                { backgroundColor: index === stepIndex ? theme.colors.primary : theme.colors.outline },
                index === stepIndex && { width: 24 }
              ]}
              accessibilityElementsHidden={true}
            />
          ))}
        </View>
      </Animatable.View>
    );
  };

  const renderActionButtons = () => {
    if (currentStep < celebrationMessages.length) return null;

    const stepIndex = currentStep - celebrationMessages.length;
    const isLastStep = stepIndex === onboardingSteps.length - 1;

    return (
      <Animatable.View 
        animation={accessibility.shouldReduceMotion() ? undefined : "slideInUp"} 
        delay={AccessibilityUtils.getAnimationDuration(400)}
        style={styles.actionContainer}
      >
        {isLastStep ? (
          <Focusable id="get-started-button" order={1}>
            <TouchableOpacity
              style={[styles.primaryButton, { 
                backgroundColor: theme.colors.primary,
                minHeight: theme.spacing.minTouchTarget
              }]}
              onPress={handleGetStarted}
              {...AccessibilityHelpers.getButtonProps(
                'Get started with Ascend',
                'Begin using the Ascend app'
              )}
            >
              <Text style={[styles.primaryButtonText, { 
                color: theme.colors.onPrimary,
                fontSize: theme.typography.fontSizes.medium,
                fontWeight: theme.typography.fontWeights.semibold
              }]}>
                Get Started
              </Text>
            </TouchableOpacity>
          </Focusable>
        ) : (
          <View style={styles.navigationButtons}>
            <Focusable id="skip-button" order={1}>
              <TouchableOpacity
                style={[styles.secondaryButton, { 
                  borderColor: theme.colors.outline,
                  minHeight: theme.spacing.minTouchTarget
                }]}
                onPress={handleSkipOnboarding}
                {...AccessibilityHelpers.getButtonProps(
                  'Skip onboarding',
                  'Skip the introduction and go directly to the app'
                )}
              >
                <Text style={[styles.secondaryButtonText, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: theme.typography.fontSizes.medium,
                  fontWeight: theme.typography.fontWeights.semibold
                }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </Focusable>
            
            <Focusable id="next-button" order={2}>
              <TouchableOpacity
                style={[styles.primaryButton, { 
                  backgroundColor: theme.colors.primary,
                  minHeight: theme.spacing.minTouchTarget
                }]}
                onPress={() => {
                  setCurrentStep(currentStep + 1);
                  accessibility.announceProgress(stepIndex + 2, onboardingSteps.length, onboardingSteps[stepIndex + 1]?.title);
                }}
                {...AccessibilityHelpers.getButtonProps(
                  'Next step',
                  'Continue to the next onboarding step'
                )}
              >
                <Text style={[styles.primaryButtonText, { 
                  color: theme.colors.onPrimary,
                  fontSize: theme.typography.fontSizes.medium,
                  fontWeight: theme.typography.fontWeights.semibold
                }]}>
                  Next
                </Text>
              </TouchableOpacity>
            </Focusable>
          </View>
        )}
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardNavigation enabled={currentStep >= celebrationMessages.length} autoFocus={true}>
        <View style={styles.content}>
          {/* Celebration Phase */}
          {currentStep < celebrationMessages.length && renderCelebration()}
          
          {/* Onboarding Phase */}
          {currentStep >= celebrationMessages.length && (
            <>
              {renderOnboarding()}
              {renderActionButtons()}
            </>
          )}
          
          {/* Auto-advance through celebration */}
          {currentStep < celebrationMessages.length - 1 && (
            <Focusable id="skip-celebration" order={0}>
              <TouchableOpacity
                style={[styles.skipCelebration, { minHeight: theme.spacing.minTouchTarget }]}
                onPress={() => {
                  setCurrentStep(celebrationMessages.length);
                  accessibility.announceForScreenReader('Skipped to onboarding');
                }}
                {...AccessibilityHelpers.getButtonProps(
                  'Skip celebration',
                  'Skip the celebration animation'
                )}
              >
                <Text style={[styles.skipCelebrationText, { 
                  color: theme.colors.onSurfaceVariant,
                  fontSize: theme.typography.fontSizes.medium
                }]}>
                  Skip
                </Text>
              </TouchableOpacity>
            </Focusable>
          )}
        </View>
      </KeyboardNavigation>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  verificationDetails: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  onboardingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 20,
  },
  onboardingIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  onboardingDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#2563EB',
    width: 24,
  },
  actionContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 48,
    flex: 1,
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 48,
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  skipCelebration: {
    position: 'absolute',
    top: 60,
    right: 24,
    padding: 12,
  },
  skipCelebrationText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default VerificationSuccessScreen;