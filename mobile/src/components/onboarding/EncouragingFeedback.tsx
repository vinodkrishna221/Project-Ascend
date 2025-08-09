import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface EncouragingFeedbackProps {
  type: 'success' | 'progress' | 'encouragement' | 'tip' | 'celebration';
  message: string;
  submessage?: string;
  icon?: string;
  autoHide?: boolean;
  duration?: number;
  onHide?: () => void;
}

const EncouragingFeedback: React.FC<EncouragingFeedbackProps> = ({
  type,
  message,
  submessage,
  icon,
  autoHide = false,
  duration = 3000,
  onHide,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Announce feedback to screen readers
    AccessibilityInfo.announceForAccessibility(message);

    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onHide?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, autoHide, duration, onHide]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: styles.successContainer,
          icon: '✅',
          iconColor: '#059669',
          textColor: '#065F46',
        };
      case 'progress':
        return {
          container: styles.progressContainer,
          icon: '🚀',
          iconColor: '#2563EB',
          textColor: '#1E40AF',
        };
      case 'encouragement':
        return {
          container: styles.encouragementContainer,
          icon: '💪',
          iconColor: '#7C3AED',
          textColor: '#5B21B6',
        };
      case 'tip':
        return {
          container: styles.tipContainer,
          icon: '💡',
          iconColor: '#F59E0B',
          textColor: '#92400E',
        };
      case 'celebration':
        return {
          container: styles.celebrationContainer,
          icon: '🎉',
          iconColor: '#EC4899',
          textColor: '#BE185D',
        };
      default:
        return {
          container: styles.defaultContainer,
          icon: 'ℹ️',
          iconColor: '#6B7280',
          textColor: '#374151',
        };
    }
  };

  const typeStyles = getTypeStyles();
  const displayIcon = icon || typeStyles.icon;

  if (!isVisible) return null;

  return (
    <Animatable.View
      animation="bounceIn"
      duration={600}
      style={[styles.container, typeStyles.container]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* Icon */}
      <Animatable.Text
        animation="pulse"
        iterationCount={type === 'celebration' ? 'infinite' : 1}
        style={[styles.icon, { color: typeStyles.iconColor }]}
      >
        {displayIcon}
      </Animatable.Text>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.message, { color: typeStyles.textColor }]}>
          {message}
        </Text>
        {submessage && (
          <Text style={[styles.submessage, { color: typeStyles.textColor }]}>
            {submessage}
          </Text>
        )}
      </View>

      {/* Celebration Confetti Effect */}
      {type === 'celebration' && (
        <View style={styles.confettiContainer}>
          <Animatable.Text
            animation="bounceIn"
            delay={200}
            style={[styles.confetti, styles.confetti1]}
          >
            ✨
          </Animatable.Text>
          <Animatable.Text
            animation="bounceIn"
            delay={400}
            style={[styles.confetti, styles.confetti2]}
          >
            🎊
          </Animatable.Text>
          <Animatable.Text
            animation="bounceIn"
            delay={600}
            style={[styles.confetti, styles.confetti3]}
          >
            ⭐
          </Animatable.Text>
        </View>
      )}
    </Animatable.View>
  );
};

// Predefined encouraging messages for different scenarios
export const EncouragingMessages = {
  emailSent: {
    type: 'success' as const,
    message: "Great! We've sent you a verification code",
    submessage: "Check your email and enter the code below",
  },
  codeVerified: {
    type: 'celebration' as const,
    message: "Awesome! Your email is verified",
    submessage: "You're one step closer to joining the community",
  },
  collegeSelected: {
    type: 'progress' as const,
    message: "Perfect choice!",
    submessage: "Let's verify your credentials with this college",
  },
  credentialsVerified: {
    type: 'celebration' as const,
    message: "Verification successful!",
    submessage: "Welcome to the Ascend student community",
  },
  firstStep: {
    type: 'encouragement' as const,
    message: "You're doing great!",
    submessage: "Every journey begins with a single step",
  },
  halfwayThere: {
    type: 'progress' as const,
    message: "You're halfway there!",
    submessage: "Keep going, you've got this",
  },
  almostDone: {
    type: 'encouragement' as const,
    message: "Almost finished!",
    submessage: "Just a few more steps to go",
  },
  tipEmailCheck: {
    type: 'tip' as const,
    message: "Pro tip: Check your spam folder",
    submessage: "Sometimes verification emails end up there",
  },
  tipTakeTime: {
    type: 'tip' as const,
    message: "Take your time",
    submessage: "There's no rush - we want to get this right",
  },
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    borderLeftColor: '#059669',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  progressContainer: {
    backgroundColor: '#EBF4FF',
    borderLeftColor: '#2563EB',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  encouragementContainer: {
    backgroundColor: '#F3E8FF',
    borderLeftColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  tipContainer: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  celebrationContainer: {
    backgroundColor: '#FDF2F8',
    borderLeftColor: '#EC4899',
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  defaultContainer: {
    backgroundColor: '#F9FAFB',
    borderLeftColor: '#6B7280',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 22,
  },
  submessage: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    fontSize: 16,
  },
  confetti1: {
    top: 8,
    right: 20,
  },
  confetti2: {
    top: 20,
    right: 8,
  },
  confetti3: {
    bottom: 8,
    right: 16,
  },
});

export default EncouragingFeedback;