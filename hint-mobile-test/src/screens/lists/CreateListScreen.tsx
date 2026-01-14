/**
 * Hint Mobile - Create List Screen
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, HelperText, Text, Surface, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { listService } from '../../../shared/services';

export default function CreateListScreen({ navigation }: ListsScreenProps<'CreateList'>) {
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'friends' | 'public'>('friends');
  const [keyDate, setKeyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
        key_date: keyDate?.toISOString().split('T')[0],
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setKeyDate(selectedDate);
    }
  };

  const clearDate = () => {
    setKeyDate(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

          {/* Due Date Section */}
          <Text variant="labelLarge" style={styles.label}>
            Due Date (Optional)
          </Text>
          <Surface style={[styles.dateContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
            <View style={styles.dateRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {keyDate ? keyDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No date set'}
              </Text>
              <View style={styles.dateActions}>
                {keyDate && (
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={clearDate}
                  />
                )}
                <Button
                  mode="text"
                  onPress={() => setShowDatePicker(true)}
                  compact
                >
                  {keyDate ? 'Change' : 'Set Date'}
                </Button>
              </View>
            </View>
          </Surface>
          <Text variant="bodySmall" style={[styles.dateHint, { color: theme.colors.onSurfaceVariant }]}>
            Great for birthdays, holidays, or special occasions
          </Text>

          {showDatePicker && (
            <DateTimePicker
              value={keyDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  dateContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateHint: {
    marginBottom: 24,
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
