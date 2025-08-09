import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackScreenProps } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// Import authentication screens
import {
  WelcomeScreen,
  EmailVerificationScreen,
  CollegeSelectionScreen,
  CollegeCredentialsScreen,
  VerificationSuccessScreen
} from './src/screens/auth';

// Import accessibility providers
import { HighContrastProvider } from './src/components/accessibility/HighContrastProvider';

// Define navigation param list
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

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <HighContrastProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            cardStyleInterpolator: ({ current, layouts }) => {
              return {
                cardStyle: {
                  transform: [
                    {
                      translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                      }),
                    },
                  ],
                },
              };
            },
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{ title: 'Welcome to Ascend' }}
          />
          <Stack.Screen 
            name="EmailVerification" 
            component={EmailVerificationScreen}
            options={{ title: 'Email Verification' }}
          />
          <Stack.Screen 
            name="CollegeSelection" 
            component={CollegeSelectionScreen}
            options={{ title: 'Select Your College' }}
          />
          <Stack.Screen 
            name="CollegeCredentials" 
            component={CollegeCredentialsScreen}
            options={{ title: 'Verify Credentials' }}
          />
          <Stack.Screen 
            name="VerificationSuccess" 
            component={VerificationSuccessScreen}
            options={{ title: 'Success!' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </HighContrastProvider>
  );
}