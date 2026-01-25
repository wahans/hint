/**
 * Hint Mobile - Loading Screen Component
 * Displays branded splash screen during app initialization
 */

import React from 'react';
import { View, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <View style={styles.container} accessibilityLabel="Loading hint app">
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Hint logo"
      />
      <Text variant="headlineMedium" style={styles.title}>
        hint
      </Text>
      <ActivityIndicator
        size="large"
        color="#228855"
        style={styles.spinner}
        accessibilityLabel={message}
      />
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9f4',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    color: '#228855',
    fontWeight: '700',
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    color: '#525252',
  },
});
