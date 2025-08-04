import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
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

type CollegeSelectionScreenProps = StackScreenProps<RootStackParamList, 'CollegeSelection'>;

const CollegeSelectionScreen: React.FC<CollegeSelectionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { role } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const accessibility = useAccessibility();
  const { theme } = useHighContrast();

  useEffect(() => {
    // Announce page load for screen readers
    accessibility.announcePageChange(
      'College Selection',
      'Choose your college from the list for database verification'
    );
    loadColleges();
  }, [accessibility]);

  useEffect(() => {
    filterColleges();
  }, [searchQuery, colleges]);

  const loadColleges = async () => {
    try {
      const response = await fetch('/api/v1/colleges');
      const data = await response.json();
      
      if (data.success) {
        // Filter colleges that don't provide email or require database verification
        const databaseVerificationColleges = data.data.filter(
          (college: College) => !college.providesEmail || college.verificationMethod === 'database'
        );
        setColleges(databaseVerificationColleges);
        setFilteredColleges(databaseVerificationColleges);
      } else {
        Alert.alert('Error', 'Failed to load colleges. Please try again.');
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: loadColleges }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filterColleges = () => {
    if (!searchQuery.trim()) {
      setFilteredColleges(colleges);
      return;
    }

    const filtered = colleges.filter(college =>
      college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      college.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredColleges(filtered);
  };

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    accessibility.announceForScreenReader(`${college.name} selected`);
  };

  const handleContinue = () => {
    if (!selectedCollege) return;

    if (selectedCollege.verificationMethod === 'database') {
      navigation.navigate('CollegeCredentials', {
        role,
        college: selectedCollege,
      });
    } else {
      // Handle manual verification or other methods
      Alert.alert(
        'Manual Verification Required',
        'This college requires manual verification. Please contact support for assistance.',
        [
          { text: 'Contact Support', onPress: () => {/* Handle support contact */} },
          { text: 'Choose Different College' }
        ]
      );
    }
  };

  const renderCollegeItem = ({ item, index }: { item: College; index: number }) => (
    <Focusable id={`college-${item.id}`} order={index + 10}>
      <TouchableOpacity
        style={[
          styles.collegeItem,
          { 
            backgroundColor: selectedCollege?.id === item.id ? theme.colors.primaryContainer : theme.colors.surface,
            borderColor: selectedCollege?.id === item.id ? theme.colors.primary : theme.colors.outline,
            borderWidth: theme.borders.medium,
            minHeight: theme.spacing.minTouchTarget
          }
        ]}
        onPress={() => handleCollegeSelect(item)}
        {...AccessibilityHelpers.getButtonProps(
          `Select ${item.name}`,
          `College in ${item.location}, uses ${item.verificationMethod} verification`,
          false,
          selectedCollege?.id === item.id
        )}
        accessibilityState={{ selected: selectedCollege?.id === item.id }}
      >
        <View style={styles.collegeInfo}>
          <Text style={[styles.collegeName, { 
            color: selectedCollege?.id === item.id ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
            fontSize: theme.typography.fontSizes.medium,
            fontWeight: theme.typography.fontWeights.semibold
          }]}>
            {item.name}
          </Text>
          <Text style={[styles.collegeLocation, { 
            color: selectedCollege?.id === item.id ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
            fontSize: theme.typography.fontSizes.small
          }]}>
            {item.location}
          </Text>
          <View style={[styles.verificationBadge, { backgroundColor: theme.colors.warningContainer }]}>
            <Text style={[styles.verificationBadgeText, { 
              color: theme.colors.onWarningContainer,
              fontSize: theme.typography.fontSizes.small,
              fontWeight: theme.typography.fontWeights.medium
            }]}>
              {item.verificationMethod === 'database' ? 'Database Verification' : 'Manual Verification'}
            </Text>
          </View>
        </View>
        {selectedCollege?.id === item.id && (
          <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.checkmarkText, { 
              color: theme.colors.onPrimary,
              fontSize: theme.typography.fontSizes.medium,
              fontWeight: theme.typography.fontWeights.semibold
            }]}>
              ✓
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Focusable>
  );

  const renderEmptyState = () => (
    <Animatable.View animation="fadeIn" style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No colleges found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() 
          ? `No colleges match "${searchQuery}". Try a different search term.`
          : 'No colleges available for database verification at the moment.'
        }
      </Text>
      {!searchQuery.trim() && (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => {/* Handle college request */}}
          accessibilityRole="button"
          accessibilityLabel="Request your college to be added"
        >
          <Text style={styles.requestButtonText}>Request Your College</Text>
        </TouchableOpacity>
      )}
    </Animatable.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardNavigation enabled={true} autoFocus={true}>
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
              {...AccessibilityHelpers.getHeadingProps(1, 'Select Your College')}
            >
              Select Your College
            </Text>
            <Text style={[styles.subtitle, { 
              color: theme.colors.onSurfaceVariant,
              fontSize: theme.typography.fontSizes.medium
            }]}>
              Choose your college from the list below. We'll verify your student status using your college's database.
            </Text>
          </View>

          {/* Search Input */}
          <Focusable id="search-input" order={1}>
            <Animatable.View 
              animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
              delay={AccessibilityUtils.getAnimationDuration(200)} 
              style={styles.searchContainer}
            >
              <TextInput
                style={[styles.searchInput, { 
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.onSurface,
                  fontSize: theme.typography.fontSizes.medium,
                  minHeight: theme.spacing.minTouchTarget
                }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for your college..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoCapitalize="words"
                autoCorrect={false}
                {...AccessibilityHelpers.getInputProps(
                  'Search colleges',
                  'Type to search for your college by name or location'
                )}
              />
            </Animatable.View>
          </Focusable>

          {/* College List */}
          <Animatable.View 
            animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
            delay={AccessibilityUtils.getAnimationDuration(400)} 
            style={styles.listContainer}
          >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading colleges...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredColleges}
              renderItem={renderCollegeItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={filteredColleges.length === 0 ? styles.emptyListContainer : undefined}
            />
          )}
        </Animatable.View>

          {/* Continue Button */}
          {selectedCollege && (
            <Focusable id="continue-button" order={3}>
              <Animatable.View 
                animation={accessibility.shouldReduceMotion() ? undefined : "slideInUp"} 
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={[styles.continueButton, { 
                    backgroundColor: theme.colors.primary,
                    minHeight: theme.spacing.minTouchTarget
                  }]}
                  onPress={handleContinue}
                  {...AccessibilityHelpers.getButtonProps(
                    'Continue with selected college',
                    'Proceed to credential verification'
                  )}
                >
                  <Text style={[styles.continueButtonText, { 
                    color: theme.colors.onPrimary,
                    fontSize: theme.typography.fontSizes.medium,
                    fontWeight: theme.typography.fontWeights.semibold
                  }]}>
                    Continue with {selectedCollege.name}
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </Focusable>
          )}

          {/* Help Section */}
          <Focusable id="help-button" order={4}>
            <Animatable.View 
              animation={accessibility.shouldReduceMotion() ? undefined : "fadeInUp"} 
              delay={AccessibilityUtils.getAnimationDuration(600)} 
              style={styles.helpContainer}
            >
              <Text style={[styles.helpText, { 
                color: theme.colors.onSurfaceVariant,
                fontSize: theme.typography.fontSizes.small
              }]}>
                Can't find your college?
              </Text>
              <TouchableOpacity
                onPress={() => {/* Handle college request */}}
                style={{ minHeight: theme.spacing.minTouchTarget, justifyContent: 'center' }}
                {...AccessibilityHelpers.getButtonProps(
                  'Request college to be added',
                  'Request your college to be added to our database'
                )}
              >
                <Text style={[styles.helpButton, { 
                  color: theme.colors.primary,
                  fontSize: theme.typography.fontSizes.small,
                  fontWeight: theme.typography.fontWeights.semibold
                }]}>
                  Request to Add Your College
                </Text>
              </TouchableOpacity>
            </Animatable.View>
          </Focusable>
        </Animatable.View>
      </KeyboardNavigation>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
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
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
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
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  collegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  collegeItemSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2563EB',
  },
  collegeInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  verificationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  verificationBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
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
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  requestButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  helpButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
});

export default CollegeSelectionScreen;