/**
 * Hint Mobile - Create List Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Text } from 'react-native-paper';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { listService } from '../../../shared/services';

export default function CreateListScreen({ navigation }: ListsScreenProps<'CreateList'>) {
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'friends' | 'public'>('friends');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a list name');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await listService.createList({
        name: name.trim(),
        is_public: visibility === 'public',
      });
      if (result.error) {
        setError(result.error.message);
      } else {
        navigation.goBack();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create list');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.form}>
        <TextInput
          label="List Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          placeholder="e.g., Birthday Wishlist"
          style={styles.input}
          autoFocus
        />

        <Text variant="labelLarge" style={styles.label}>
          Who can see this list?
        </Text>

        <SegmentedButtons
          value={visibility}
          onValueChange={(value) => setVisibility(value as typeof visibility)}
          buttons={[
            { value: 'private', label: 'Private', icon: 'lock' },
            { value: 'friends', label: 'Friends', icon: 'account-group' },
            { value: 'public', label: 'Public', icon: 'earth' },
          ]}
          style={styles.segmented}
        />

        <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
          {visibility === 'private' && 'Only you can see this list'}
          {visibility === 'friends' && 'Friends can see and claim items from this list'}
          {visibility === 'public' && 'Anyone with the link can see this list'}
        </Text>

        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleCreate}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Create List
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 24,
  },
  input: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  hint: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
    paddingVertical: 4,
  },
});
