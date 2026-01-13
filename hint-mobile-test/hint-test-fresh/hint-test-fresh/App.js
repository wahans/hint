import React from 'react';
  import { View, Text, StyleSheet } from 'react-native';
  import { StatusBar } from 'expo-status-bar';

  export default function App() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>hint</Text>
        <Text style={styles.subtitle}>Your wishlist companion</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#228855',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 64,
      fontWeight: '300',
      color: 'white',
    },
    subtitle: {
      fontSize: 18,
      color: 'rgba(255,255,255,0.8)',
      marginTop: 10,
    },
  });