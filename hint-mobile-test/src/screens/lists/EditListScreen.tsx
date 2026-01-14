/**
 * Hint Mobile - Edit List Screen
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  HelperText,
  Text,
  Divider,
  IconButton,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ListsScreenProps } from '../../navigation/types';
import { useTheme } from '../../context/ThemeContext';
import { listService } from '../../../shared/services';
import type { List, NotificationLevel } from '../../../shared/types';

export default function EditListScreen({ route, navigation }: ListsScreenProps<'EditList'>) {
  const { listId } = route.params;
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'friends' | 'public'>('friends');
  const [keyDate, setKeyDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationLevel, setNotificationLevel] = useState<NotificationLevel>('both');

  const loadList = async () => {
    setIsLoading(true);
    try {
      const result = await listService.getList(listId);
      if (result.data) {
        const list = result.data;
        setName(list.name);
        setVisibility(list.is_public ? 'public' : 'friends');
        setKeyDate(list.key_date ? new Date(list.key_date) : null);
        setNotificationLevel(list.notification_level || 'both');
      } else {
        setError(result.error?.message || 'Failed to load list');
      }
    } catch (err) {
      setError('Failed to load list');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadList();
    }, [listId])
  );

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a list name');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const result = await listService.updateList(listId, {
        name: name.trim(),
        is_public: visibility === 'public',
        key_date: keyDate?.toISOString().split('T')[0] || undefined,
        notification_level: notificationLevel,
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        navigation.goBack();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this list? This will also delete all items in the list. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const result = await listService.deleteList(listId);
              if (result.error) {
                Alert.alert('Error', result.error.message);
              } else {
                // Navigate back to lists
                navigation.navigate('MyLists');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete list');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {/* List Name */}
          <TextInput
            label="List Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          {/* Due Date / Key Date */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
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
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            Get reminders at 60, 30, and 15 days before the date
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

          <Divider style={styles.divider} />

          {/* Visibility */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
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

          <Divider style={styles.divider} />

          {/* Notifications */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Claim Notifications
          </Text>
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant, marginBottom: 12 }]}>
            When someone claims an item from this list, notify me:
          </Text>
          <SegmentedButtons
            value={notificationLevel}
            onValueChange={(value) => setNotificationLevel(value as NotificationLevel)}
            buttons={[
              { value: 'none', label: 'None' },
              { value: 'who_only', label: 'Who' },
              { value: 'what_only', label: 'What' },
              { value: 'both', label: 'Both' },
            ]}
            style={styles.segmented}
          />
          <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
            {notificationLevel === 'none' && 'No notifications when items are claimed'}
            {notificationLevel === 'who_only' && 'Know who claimed, but not what item'}
            {notificationLevel === 'what_only' && 'Know what was claimed, but not by who'}
            {notificationLevel === 'both' && 'Get full details on claims'}
          </Text>

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={isSaving}
              disabled={isSaving || isDeleting}
              style={styles.saveButton}
            >
              Save Changes
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              disabled={isSaving || isDeleting}
              style={styles.cancelButton}
            >
              Cancel
            </Button>

            <Divider style={styles.divider} />

            <Button
              mode="text"
              icon="delete"
              onPress={handleDelete}
              loading={isDeleting}
              disabled={isSaving || isDeleting}
              textColor={theme.colors.error}
            >
              Delete List
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionLabel: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  hint: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
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
  actions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    paddingVertical: 4,
  },
  cancelButton: {
    paddingVertical: 4,
  },
});
