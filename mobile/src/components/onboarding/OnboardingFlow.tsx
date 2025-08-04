import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  encouragement: string;
  tips?: string[];
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isLoading?: boolean;
  showSkip?: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  currentStepIndex,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  isLoading = false,
  showSkip = true,
}) => {
  const [animationKey, setAnimationKey] = useState(0);
  
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    // Trigger re-animation when step changes
    setAnimationKey(prev => prev + 1);
    
    // Announce step change to screen readers
    if (currentStep) {
      AccessibilityInfo.announceForAccessibility(
        `Step ${currentStepIndex + 1} of ${steps.length}: ${currentStep.title}`
      );
    }
  }, [currentStepIndex, currentStep, steps.length]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animatable.View
              animation="slideInLeft"
              duration={500}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>
        
        {showSkip && !isLastStep && (
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            accessibilityHint="Skip the guided introduction"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step Content */}
      <Animatable.View
        key={animationKey}
        animation="fadeInUp"
        duration={600}
        style={styles.stepContent}
      >
        {/* Step Icon */}
        <Animatable.Text
          animation="bounceIn"
          delay={200}
          style={styles.stepIcon}
        >
          {currentStep?.icon}
        </Animatable.Text>

        {/* Step Title */}
        <Animatable.Text
          animation="fadeInUp"
          delay={400}
          style={styles.stepTitle}
        >
          {currentStep?.title}
        </Animatable.Text>

        {/* Step Description */}
        <Animatable.Text
          animation="fadeInUp"
          delay={600}
          style={styles.stepDescription}
        >
          {currentStep?.description}
        </Animatable.Text>

        {/* Encouragement Message */}
        <Animatable.View
          animation="fadeInUp"
          delay={800}
          style={styles.encouragementContainer}
        >
          <Text style={styles.encouragementText}>
            💡 {currentStep?.encouragement}
          </Text>
        </Animatable.View>

        {/* Tips Section */}
        {currentStep?.tips && currentStep.tips.length > 0 && (
          <Animatable.View
            animation="fadeInUp"
            delay={1000}
            style={styles.tipsContainer}
          >
            <Text style={styles.tipsTitle}>Helpful Tips:</Text>
            {currentStep.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Animatable.View>
        )}
      </Animatable.View>

      {/* Navigation Buttons */}
      <Animatable.View
        animation="slideInUp"
        delay={1200}
        style={styles.navigationContainer}
      >
        <View style={styles.buttonRow}>
          {!isFirstStep && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onPrevious}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Previous step"
              accessibilityHint="Go back to the previous step"
              accessibilityState={{ disabled: isLoading }}
            >
              <Text style={styles.secondaryButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isFirstStep && styles.primaryButtonFullWidth,
              isLoading && styles.primaryButtonDisabled
            ]}
            onPress={handleNext}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? "Complete onboarding" : "Next step"}
            accessibilityHint={isLastStep ? "Finish the guided introduction" : "Continue to the next step"}
            accessibilityState={{ disabled: isLoading }}
          >
            <Text style={[
              styles.primaryButtonText,
              isLoading && styles.primaryButtonTextDisabled
            ]}>
              {isLoading 
                ? 'Loading...' 
                : isLastStep 
                  ? 'Get Started' 
                  : 'Continue'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  progressContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  encouragementContainer: {
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  encouragementText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  navigationContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    minHeight: 48,
    flex: 1,
    marginLeft: 8,
  },
  primaryButtonFullWidth: {
    marginLeft: 0,
  },
  primaryButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: '#9CA3AF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
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
});

export default OnboardingFlow;