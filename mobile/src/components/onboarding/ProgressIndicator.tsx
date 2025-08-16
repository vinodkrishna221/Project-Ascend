import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  showStepTitles?: boolean;
  variant?: 'dots' | 'bar' | 'steps';
  size?: 'small' | 'medium' | 'large';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  showStepTitles = false,
  variant = 'bar',
  size = 'medium',
}) => {
  const progress = (currentStep / totalSteps) * 100;

  React.useEffect(() => {
    // Announce progress changes to screen readers
    AccessibilityInfo.announceForAccessibility(
      `Step ${currentStep} of ${totalSteps} completed`
    );
  }, [currentStep, totalSteps]);

  const renderBarProgress = () => (
    <View style={styles.barContainer}>
      <View style={[styles.barTrack, styles[`barTrack${size}`]]}>
        <Animatable.View
          animation="slideInLeft"
          duration={500}
          style={[
            styles.barFill,
            styles[`barFill${size}`],
            { width: `${progress}%` }
          ]}
        />
      </View>
      <Text style={[styles.progressText, styles[`progressText${size}`]]}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderDotsProgress = () => (
    <View style={styles.dotsContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <Animatable.View
          key={index}
          animation={index < currentStep ? "bounceIn" : undefined}
          delay={index * 100}
          style={[
            styles.dot,
            styles[`dot${size}`],
            index < currentStep && styles.dotCompleted,
            index === currentStep && styles.dotCurrent,
          ]}
        />
      ))}
    </View>
  );

  const renderStepsProgress = () => (
    <View style={styles.stepsContainer}>
      {Array.from({ length: totalSteps }, (_, index) => (
        <View key={index} style={styles.stepItem}>
          <Animatable.View
            animation={index <= currentStep ? "bounceIn" : undefined}
            delay={index * 100}
            style={[
              styles.stepCircle,
              styles[`stepCircle${size}`],
              index < currentStep && styles.stepCircleCompleted,
              index === currentStep && styles.stepCircleCurrent,
            ]}
          >
            <Text style={[
              styles.stepNumber,
              styles[`stepNumber${size}`],
              index < currentStep && styles.stepNumberCompleted,
              index === currentStep && styles.stepNumberCurrent,
            ]}>
              {index < currentStep ? '✓' : index + 1}
            </Text>
          </Animatable.View>
          
          {showStepTitles && stepTitles[index] && (
            <Text style={[
              styles.stepTitle,
              styles[`stepTitle${size}`],
              index <= currentStep && styles.stepTitleActive,
            ]}>
              {stepTitles[index]}
            </Text>
          )}
          
          {index < totalSteps - 1 && (
            <View style={[
              styles.stepConnector,
              styles[`stepConnector${size}`],
              index < currentStep && styles.stepConnectorCompleted,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderProgress = () => {
    switch (variant) {
      case 'dots':
        return renderDotsProgress();
      case 'steps':
        return renderStepsProgress();
      case 'bar':
      default:
        return renderBarProgress();
    }
  };

  return (
    <View 
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      accessibilityLabel={`Progress: ${currentStep} of ${totalSteps} steps completed`}
    >
      {renderProgress()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  
  // Bar Progress Styles
  barContainer: {
    width: '100%',
    alignItems: 'center',
  },
  barTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    width: '100%',
    marginBottom: 8,
  },
  barTracksmall: {
    height: 2,
  },
  barTrackmedium: {
    height: 4,
  },
  barTracklarge: {
    height: 6,
  },
  barFill: {
    backgroundColor: '#2563EB',
    borderRadius: 2,
    height: '100%',
  },
  barFillsmall: {},
  barFillmedium: {},
  barFilllarge: {},
  progressText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  progressTextsmall: {
    fontSize: 10,
  },
  progressTextmedium: {
    fontSize: 12,
  },
  progressTextlarge: {
    fontSize: 14,
  },
  
  // Dots Progress Styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: '#E5E7EB',
    borderRadius: 50,
    marginHorizontal: 4,
  },
  dotsmall: {
    width: 6,
    height: 6,
  },
  dotmedium: {
    width: 8,
    height: 8,
  },
  dotlarge: {
    width: 10,
    height: 10,
  },
  dotCompleted: {
    backgroundColor: '#2563EB',
  },
  dotCurrent: {
    backgroundColor: '#3B82F6',
    transform: [{ scale: 1.2 }],
  },
  
  // Steps Progress Styles
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCirclesmall: {
    width: 24,
    height: 24,
  },
  stepCirclemedium: {
    width: 32,
    height: 32,
  },
  stepCirclelarge: {
    width: 40,
    height: 40,
  },
  stepCircleCompleted: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  stepCircleCurrent: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2563EB',
  },
  stepNumber: {
    fontWeight: '600',
    color: '#9CA3AF',
  },
  stepNumbersmall: {
    fontSize: 10,
  },
  stepNumbermedium: {
    fontSize: 12,
  },
  stepNumberlarge: {
    fontSize: 14,
  },
  stepNumberCompleted: {
    color: '#FFFFFF',
  },
  stepNumberCurrent: {
    color: '#2563EB',
  },
  stepTitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepTitlesmall: {
    fontSize: 10,
    maxWidth: 60,
  },
  stepTitlemedium: {
    fontSize: 12,
    maxWidth: 80,
  },
  stepTitlelarge: {
    fontSize: 14,
    maxWidth: 100,
  },
  stepTitleActive: {
    color: '#374151',
  },
  stepConnector: {
    position: 'absolute',
    backgroundColor: '#E5E7EB',
    top: '50%',
    left: '100%',
  },
  stepConnectorsmall: {
    width: 20,
    height: 2,
    marginTop: -1,
  },
  stepConnectormedium: {
    width: 30,
    height: 2,
    marginTop: -1,
  },
  stepConnectorlarge: {
    width: 40,
    height: 3,
    marginTop: -1.5,
  },
  stepConnectorCompleted: {
    backgroundColor: '#2563EB',
  },
});

export default ProgressIndicator;