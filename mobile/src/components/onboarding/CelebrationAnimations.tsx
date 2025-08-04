import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface CelebrationAnimationsProps {
  type: 'success' | 'milestone' | 'completion' | 'welcome';
  message?: string;
  submessage?: string;
  autoPlay?: boolean;
  duration?: number;
  onComplete?: () => void;
}

const CelebrationAnimations: React.FC<CelebrationAnimationsProps> = ({
  type,
  message,
  submessage,
  autoPlay = true,
  duration = 3000,
  onComplete,
}) => {
  const confettiRefs = useRef<Array<Animatable.View | null>>([]);

  useEffect(() => {
    if (autoPlay) {
      // Announce celebration to screen readers
      const celebrationMessage = message || getCelebrationMessage(type);
      AccessibilityInfo.announceForAccessibility(
        `Celebration! ${celebrationMessage}`
      );

      // Auto-complete after duration
      if (onComplete) {
        const timer = setTimeout(onComplete, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [autoPlay, duration, message, onComplete, type]);

  const getCelebrationMessage = (celebrationType: string): string => {
    switch (celebrationType) {
      case 'success':
        return 'Success! Well done!';
      case 'milestone':
        return 'Milestone achieved!';
      case 'completion':
        return 'Congratulations! You did it!';
      case 'welcome':
        return 'Welcome to Ascend!';
      default:
        return 'Celebration!';
    }
  };

  const getCelebrationConfig = () => {
    switch (type) {
      case 'success':
        return {
          primaryEmoji: '🎉',
          secondaryEmojis: ['✨', '🌟', '⭐'],
          colors: ['#059669', '#10B981', '#34D399'],
          message: message || 'Success!',
          submessage: submessage || 'Great job completing this step!',
        };
      case 'milestone':
        return {
          primaryEmoji: '🚀',
          secondaryEmojis: ['💫', '🌟', '✨'],
          colors: ['#2563EB', '#3B82F6', '#60A5FA'],
          message: message || 'Milestone Reached!',
          submessage: submessage || 'You\'re making excellent progress!',
        };
      case 'completion':
        return {
          primaryEmoji: '🎊',
          secondaryEmojis: ['🎉', '🥳', '🎈'],
          colors: ['#7C3AED', '#8B5CF6', '#A78BFA'],
          message: message || 'Congratulations!',
          submessage: submessage || 'You\'ve successfully completed verification!',
        };
      case 'welcome':
        return {
          primaryEmoji: '👋',
          secondaryEmojis: ['🌈', '✨', '🎯'],
          colors: ['#EC4899', '#F472B6', '#F9A8D4'],
          message: message || 'Welcome to Ascend!',
          submessage: submessage || 'Your student journey begins now!',
        };
      default:
        return {
          primaryEmoji: '🎉',
          secondaryEmojis: ['✨', '🌟', '⭐'],
          colors: ['#059669', '#10B981', '#34D399'],
          message: message || 'Celebration!',
          submessage: submessage || 'Something awesome happened!',
        };
    }
  };

  const config = getCelebrationConfig();

  const renderConfetti = () => {
    const confettiItems = [];
    const confettiCount = 12;

    for (let i = 0; i < confettiCount; i++) {
      const emoji = config.secondaryEmojis[i % config.secondaryEmojis.length];
      const delay = i * 100;
      const randomX = Math.random() * (width - 40);
      const randomRotation = Math.random() * 360;

      confettiItems.push(
        <Animatable.View
          key={i}
          ref={(ref) => (confettiRefs.current[i] = ref as any)}
          animation="bounceIn"
          delay={delay}
          duration={800}
          style={[
            styles.confettiItem,
            {
              left: randomX,
              transform: [{ rotate: `${randomRotation}deg` }],
            },
          ]}
        >
          <Animatable.Text
            animation="pulse"
            iterationCount="infinite"
            style={styles.confettiEmoji}
          >
            {emoji}
          </Animatable.Text>
        </Animatable.View>
      );
    }

    return confettiItems;
  };

  const renderFireworks = () => {
    const fireworks = [];
    const fireworkCount = 6;

    for (let i = 0; i < fireworkCount; i++) {
      const delay = i * 200;
      const randomX = Math.random() * (width - 60);
      const randomY = Math.random() * 200 + 100;

      fireworks.push(
        <Animatable.View
          key={`firework-${i}`}
          animation="zoomIn"
          delay={delay}
          duration={600}
          style={[
            styles.firework,
            {
              left: randomX,
              top: randomY,
            },
          ]}
        >
          <Animatable.Text
            animation="rotate"
            iterationCount="infinite"
            duration={2000}
            style={styles.fireworkEmoji}
          >
            ✨
          </Animatable.Text>
        </Animatable.View>
      );
    }

    return fireworks;
  };

  const renderPulsingRings = () => {
    const rings = [];
    const ringCount = 3;

    for (let i = 0; i < ringCount; i++) {
      const delay = i * 300;
      const scale = 1 + i * 0.5;

      rings.push(
        <Animatable.View
          key={`ring-${i}`}
          animation="pulse"
          iterationCount="infinite"
          delay={delay}
          duration={1500}
          style={[
            styles.pulsingRing,
            {
              transform: [{ scale }],
              borderColor: config.colors[i % config.colors.length],
            },
          ]}
        />
      );
    }

    return rings;
  };

  return (
    <View style={styles.container}>
      {/* Background Effects */}
      <View style={styles.backgroundEffects}>
        {type === 'completion' && renderFireworks()}
        {(type === 'success' || type === 'milestone') && renderPulsingRings()}
      </View>

      {/* Confetti */}
      <View style={styles.confettiContainer}>
        {renderConfetti()}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Primary Emoji */}
        <Animatable.Text
          animation="bounceIn"
          duration={1000}
          style={styles.primaryEmoji}
        >
          {config.primaryEmoji}
        </Animatable.Text>

        {/* Message */}
        <Animatable.Text
          animation="fadeInUp"
          delay={500}
          duration={800}
          style={[styles.message, { color: config.colors[0] }]}
        >
          {config.message}
        </Animatable.Text>

        {/* Submessage */}
        {config.submessage && (
          <Animatable.Text
            animation="fadeInUp"
            delay={800}
            duration={800}
            style={styles.submessage}
          >
            {config.submessage}
          </Animatable.Text>
        )}

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <Animatable.Text
            animation="bounceIn"
            delay={1000}
            style={[styles.decorativeEmoji, styles.decorativeLeft]}
          >
            {config.secondaryEmojis[0]}
          </Animatable.Text>
          <Animatable.Text
            animation="bounceIn"
            delay={1200}
            style={[styles.decorativeEmoji, styles.decorativeRight]}
          >
            {config.secondaryEmojis[1]}
          </Animatable.Text>
        </View>
      </View>

      {/* Bottom Sparkles */}
      <View style={styles.bottomSparkles}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Animatable.Text
            key={`sparkle-${index}`}
            animation="flash"
            iterationCount="infinite"
            delay={index * 200}
            duration={1000}
            style={[
              styles.sparkle,
              { left: (index * width) / 5 + 20 },
            ]}
          >
            ✨
          </Animatable.Text>
        ))}
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  backgroundEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  confettiItem: {
    position: 'absolute',
    top: 50,
  },
  confettiEmoji: {
    fontSize: 20,
  },
  firework: {
    position: 'absolute',
  },
  fireworkEmoji: {
    fontSize: 24,
  },
  pulsingRing: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    marginLeft: -50,
    marginTop: -50,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    paddingHorizontal: 40,
  },
  primaryEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  message: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  submessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  decorativeElements: {
    position: 'relative',
    width: '100%',
    height: 40,
  },
  decorativeEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  decorativeLeft: {
    left: 20,
    top: 0,
  },
  decorativeRight: {
    right: 20,
    top: 0,
  },
  bottomSparkles: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 30,
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 16,
  },
});

export default CelebrationAnimations;