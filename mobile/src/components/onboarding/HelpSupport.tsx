import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

interface HelpSupportProps {
  visible: boolean;
  onClose: () => void;
  context?: 'email_verification' | 'college_selection' | 'credentials' | 'general';
  userRole?: 'student' | 'aspirant';
}

interface HelpItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  context?: string[];
}

const HelpSupport: React.FC<HelpSupportProps> = ({
  visible,
  onClose,
  context = 'general',
  userRole = 'student',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('faq');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const helpCategories = [
    { id: 'faq', title: 'FAQ', icon: '❓' },
    { id: 'contact', title: 'Contact Us', icon: '📞' },
    { id: 'guides', title: 'Step-by-Step Guides', icon: '📖' },
    { id: 'troubleshoot', title: 'Troubleshooting', icon: '🔧' },
  ];

  const faqItems: HelpItem[] = [
    {
      id: 'email_not_received',
      question: 'I haven\'t received the verification email',
      answer: 'Check your spam/junk folder first. If it\'s not there, make sure you entered your email correctly and try requesting a new code. Some college email systems may take a few minutes to deliver emails.',
      category: 'faq',
      context: ['email_verification'],
    },
    {
      id: 'college_not_listed',
      question: 'My college is not in the list',
      answer: 'We\'re constantly adding new colleges. You can request your college to be added using the "Request Your College" button. In the meantime, check if your college has an alternative verification method available.',
      category: 'faq',
      context: ['college_selection'],
    },
    {
      id: 'credentials_not_working',
      question: 'My college credentials are not working',
      answer: 'Make sure you\'re entering your details exactly as they appear in your college records. Contact your college administration to verify your verification password. If you\'re still having trouble, our support team can help.',
      category: 'faq',
      context: ['credentials'],
    },
    {
      id: 'student_vs_aspirant',
      question: 'What\'s the difference between Student and Aspirant?',
      answer: 'Students are currently enrolled in college and have full access to all features. Aspirants are planning to join college and have access to Q&A sections and public communities to help with college selection.',
      category: 'faq',
      context: ['general'],
    },
    {
      id: 'verification_failed',
      question: 'My verification keeps failing',
      answer: 'This could be due to several reasons: incorrect credentials, expired verification codes, or technical issues. Try refreshing the app, check your internet connection, and ensure your details are correct. Contact support if the problem persists.',
      category: 'troubleshoot',
      context: ['email_verification', 'credentials'],
    },
  ];

  const contactOptions = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email (response within 24 hours)',
      action: () => handleEmailSupport(),
      icon: '📧',
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team (available 9 AM - 6 PM)',
      action: () => handleLiveChat(),
      icon: '💬',
    },
    {
      id: 'community',
      title: 'Community Help',
      description: 'Ask other students in our help community',
      action: () => handleCommunityHelp(),
      icon: '👥',
    },
  ];

  const guides = [
    {
      id: 'email_guide',
      title: 'Email Verification Guide',
      description: 'Step-by-step guide for email verification',
      steps: [
        'Enter your college email address',
        'Check your email inbox (and spam folder)',
        'Enter the 6-digit verification code',
        'Complete your profile setup',
      ],
      context: ['email_verification'],
    },
    {
      id: 'database_guide',
      title: 'Database Verification Guide',
      description: 'How to verify using college database',
      steps: [
        'Select your college from the list',
        'Enter your details as registered with college',
        'Use the verification password from your college',
        'Complete verification and profile setup',
      ],
      context: ['college_selection', 'credentials'],
    },
  ];

  const handleEmailSupport = () => {
    const subject = `Help with ${context} - ${userRole}`;
    const body = `Hi Ascend Support,\n\nI need help with ${context}.\n\nMy role: ${userRole}\nIssue: [Please describe your issue here]\n\nThanks!`;
    const emailUrl = `mailto:support@ascend.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert(
        'Email App Not Available',
        'Please send an email to support@ascend.app with your issue details.',
        [{ text: 'OK' }]
      );
    });
  };

  const handleLiveChat = () => {
    // In a real app, this would open a chat widget
    Alert.alert(
      'Live Chat',
      'Live chat will be available soon! For now, please use email support or community help.',
      [{ text: 'OK' }]
    );
  };

  const handleCommunityHelp = () => {
    // In a real app, this would navigate to community help section
    Alert.alert(
      'Community Help',
      'Community help section will be available after you complete verification!',
      [{ text: 'OK' }]
    );
  };

  const getFilteredFAQ = () => {
    return faqItems.filter(item => 
      !item.context || item.context.includes(context)
    );
  };

  const getFilteredGuides = () => {
    return guides.filter(guide => 
      !guide.context || guide.context.includes(context)
    );
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
    AccessibilityInfo.announceForAccessibility(
      expandedItem === itemId ? 'Collapsed' : 'Expanded'
    );
  };

  const renderFAQ = () => {
    const filteredFAQ = getFilteredFAQ();
    
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {filteredFAQ.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => toggleExpanded(item.id)}
              accessibilityRole="button"
              accessibilityLabel={item.question}
              accessibilityHint="Tap to expand answer"
              accessibilityState={{ expanded: expandedItem === item.id }}
            >
              <Text style={styles.faqQuestionText}>{item.question}</Text>
              <Text style={styles.faqToggle}>
                {expandedItem === item.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>
            
            {expandedItem === item.id && (
              <Animatable.View
                animation="fadeInDown"
                duration={300}
                style={styles.faqAnswer}
              >
                <Text style={styles.faqAnswerText}>{item.answer}</Text>
              </Animatable.View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderContact = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Get in Touch</Text>
      <Text style={styles.sectionDescription}>
        We're here to help! Choose the best way to reach us:
      </Text>
      
      {contactOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.contactOption}
          onPress={option.action}
          accessibilityRole="button"
          accessibilityLabel={option.title}
          accessibilityHint={option.description}
        >
          <Text style={styles.contactIcon}>{option.icon}</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>{option.title}</Text>
            <Text style={styles.contactDescription}>{option.description}</Text>
          </View>
          <Text style={styles.contactArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGuides = () => {
    const filteredGuides = getFilteredGuides();
    
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Step-by-Step Guides</Text>
        
        {filteredGuides.map((guide) => (
          <View key={guide.id} style={styles.guideItem}>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            <Text style={styles.guideDescription}>{guide.description}</Text>
            
            <View style={styles.stepsContainer}>
              {guide.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTroubleshooting = () => {
    const troubleshootingItems = faqItems.filter(item => 
      item.category === 'troubleshoot' && 
      (!item.context || item.context.includes(context))
    );
    
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Troubleshooting</Text>
        <Text style={styles.sectionDescription}>
          Common issues and how to fix them:
        </Text>
        
        {troubleshootingItems.map((item) => (
          <View key={item.id} style={styles.troubleshootItem}>
            <Text style={styles.troubleshootQuestion}>{item.question}</Text>
            <Text style={styles.troubleshootAnswer}>{item.answer}</Text>
          </View>
        ))}
        
        <View style={styles.stillNeedHelp}>
          <Text style={styles.stillNeedHelpText}>Still need help?</Text>
          <TouchableOpacity
            style={styles.contactSupportButton}
            onPress={handleEmailSupport}
            accessibilityRole="button"
            accessibilityLabel="Contact support"
          >
            <Text style={styles.contactSupportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case 'faq':
        return renderFAQ();
      case 'contact':
        return renderContact();
      case 'guides':
        return renderGuides();
      case 'troubleshoot':
        return renderTroubleshooting();
      default:
        return renderFAQ();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close help"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {helpCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryTab,
                  selectedCategory === category.id && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
                accessibilityRole="tab"
                accessibilityLabel={category.title}
                accessibilityState={{ selected: selectedCategory === category.id }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryTitle,
                  selectedCategory === category.id && styles.categoryTitleActive
                ]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderContent()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  categoryTabs: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  categoryTabActive: {
    backgroundColor: '#EBF4FF',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTitleActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
  faqAnswer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactArrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  guideItem: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  guideDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  troubleshootItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  troubleshootQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  troubleshootAnswer: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  stillNeedHelp: {
    alignItems: 'center',
    marginTop: 24,
    padding: 20,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
  },
  stillNeedHelpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  contactSupportButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  contactSupportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HelpSupport;