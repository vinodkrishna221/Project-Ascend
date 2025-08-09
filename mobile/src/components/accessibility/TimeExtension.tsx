import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { AccessibilityManager } from '../../utils/accessibility';
import { useHighContrast } from './HighContrastProvider';

interface TimeExtensionProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
  onExtensionGranted?: (newTime: number) => void;
  allowExtensions?: boolean;
  maxExtensions?: number;
  extensionDuration?: number; // in seconds
  warningThreshold?: number; // seconds before showing warning
  context?: string; // Context for accessibility announcements
}

const TimeExtension: React.FC<TimeExtensionProps> = ({
  initialTime,
  onTimeUp,
  onExtensionGranted,
  allowExtensions = true,
  maxExtensions = 3,
  extensionDuration = 300, // 5 minutes
  warningThreshold = 60, // 1 minute
  context = 'verification',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [extensionsUsed, setExtensionsUsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accessibilityManager = AccessibilityManager.getInstance();
  const { theme } = useHighContrast();

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Check if we should show warning
    if (timeRemaining <= warningThreshold && timeRemaining > 0 && !showWarning) {
      setShowWarning(true);
      announceTimeWarning();
    }

    // Check if time is up
    if (timeRemaining <= 0) {
      handleTimeUp();
    }
  }, [timeRemaining, warningThreshold, showWarning]);

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPaused(true);
    accessibilityManager.announceForScreenReader('Timer paused', 'high');
  };

  const resumeTimer = () => {
    startTimer();
    setIsPaused(false);
    accessibilityManager.announceForScreenReader('Timer resumed', 'high');
  };

  const announceTimeWarning = () => {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = minutes > 0 
      ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
      : `${seconds} second${seconds !== 1 ? 's' : ''}`;
    
    accessibilityManager.announceForScreenReader(
      `Warning: Only ${timeString} remaining for ${context}. You can request more time if needed.`,
      'high'
    );
  };

  const handleTimeUp = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (allowExtensions && extensionsUsed < maxExtensions) {
      setShowExtensionModal(true);
      accessibilityManager.announceForScreenReader(
        `Time expired for ${context}. You can request additional time.`,
        'high'
      );
    } else {
      accessibilityManager.announceForScreenReader(
        `Time expired for ${context}.`,
        'high'
      );
      onTimeUp();
    }
  };

  const requestExtension = () => {
    const newTime = timeRemaining + extensionDuration;
    setTimeRemaining(newTime);
    setExtensionsUsed(prev => prev + 1);
    setShowExtensionModal(false);
    setShowWarning(false);
    
    startTimer();
    
    const extensionMinutes = Math.floor(extensionDuration / 60);
    accessibilityManager.announceForScreenReader(
      `${extensionMinutes} minute${extensionMinutes !== 1 ? 's' : ''} added. You now have ${Math.floor(newTime / 60)} minutes remaining.`,
      'high'
    );
    
    onExtensionGranted?.(newTime);
  };

  const declineExtension = () => {
    setShowExtensionModal(false);
    onTimeUp();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeRemaining <= 30) return theme.colors.error;
    if (timeRemaining <= warningThreshold) return theme.colors.warning;
    return theme.colors.onSurface;
  };

  const renderWarningBanner = () => {
    if (!showWarning || timeRemaining <= 0) return null;

    return (
      <Animatable.View
        animation="slideInDown"
        duration={500}
        style={[styles.warningBanner, { backgroundColor: theme.colors.warningContainer }]}
      >
        <Text style={[styles.warningText, { color: theme.colors.onWarningContainer }]}>
          ⚠️ Time running out! {formatTime(timeRemaining)} remaining
        </Text>
        {allowExtensions && extensionsUsed < maxExtensions && (
          <TouchableOpacity
            style={[styles.extendButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowExtensionModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Request more time"
            accessibilityHint={`Request ${Math.floor(extensionDuration / 60)} more minutes`}
          >
            <Text style={[styles.extendButtonText, { color: theme.colors.onPrimary }]}>
              Need More Time?
            </Text>
          </TouchableOpacity>
        )}
      </Animatable.View>
    );
  };

  const renderExtensionModal = () => (
    <Modal
      visible={showExtensionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={declineExtension}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View
          animation="zoomIn"
          duration={300}
          style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Need More Time?
          </Text>
          
          <Text style={[styles.modalMessage, { color: theme.colors.onSurface }]}>
            Your time for {context} has expired. Would you like {Math.floor(extensionDuration / 60)} more minutes to complete this step?
          </Text>
          
          <Text style={[styles.modalInfo, { color: theme.colors.onSurfaceVariant }]}>
            Extensions remaining: {maxExtensions - extensionsUsed}
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.declineButton, { borderColor: theme.colors.outline }]}
              onPress={declineExtension}
              accessibilityRole="button"
              accessibilityLabel="Decline extension"
              accessibilityHint="Continue without additional time"
            >
              <Text style={[styles.declineButtonText, { color: theme.colors.onSurface }]}>
                No, Continue
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.acceptButton, { backgroundColor: theme.colors.primary }]}
              onPress={requestExtension}
              accessibilityRole="button"
              accessibilityLabel="Request extension"
              accessibilityHint={`Add ${Math.floor(extensionDuration / 60)} more minutes`}
            >
              <Text style={[styles.acceptButtonText, { color: theme.colors.onPrimary }]}>
                Yes, Add Time
              </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );

  const renderTimerControls = () => {
    const isScreenReaderActive = accessibilityManager.isScreenReaderActive();
    
    if (!isScreenReaderActive) return null;

    return (
      <View style={styles.timerControls}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.secondary }]}
          onPress={isPaused ? resumeTimer : pauseTimer}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? 'Resume timer' : 'Pause timer'}
          accessibilityHint="Control timer for accessibility"
        >
          <Text style={[styles.controlButtonText, { color: theme.colors.onSecondary }]}>
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            const announcement = `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''} remaining for ${context}`;
            accessibilityManager.announceForScreenReader(announcement, 'high');
          }}
          accessibilityRole="button"
          accessibilityLabel="Announce time remaining"
          accessibilityHint="Hear how much time is left"
        >
          <Text style={[styles.controlButtonText, { color: theme.colors.onPrimary }]}>
            🔊 Time Check
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderWarningBanner()}
      
      <View style={styles.timerDisplay}>
        <Text
          style={[
            styles.timerText,
            { color: getTimeColor(), fontSize: theme.typography.fontSizes.xlarge }
          ]}
          accessibilityRole="timer"
          accessibilityLabel={`Time remaining: ${formatTime(timeRemaining)}`}
          accessibilityLiveRegion="polite"
        >
          {formatTime(timeRemaining)}
        </Text>
        
        {isPaused && (
          <Text style={[styles.pausedText, { color: theme.colors.warning }]}>
            ⏸️ Paused
          </Text>
        )}
      </View>
      
      {renderTimerControls()}
      {renderExtensionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  warningBanner: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  extendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  extendButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pausedText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 44, // Accessibility touch target
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {
    // backgroundColor set via theme
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimeExtension;