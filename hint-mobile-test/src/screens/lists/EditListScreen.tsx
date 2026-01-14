/**
 * Hint Mobile - Edit List Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Share } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  HelperText,
  Text,
  Switch,
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
  const [shareCode, setShareCode] = useState<string | null>(null);

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
        setShareCode(list.share_code || null);
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

  const handleGenerateShareCode = async () => {
    try {
      const result = await listService.generateShareCode(listId);
      if (result.data) {
        setShareCode(result.data);
        setVisibility('public');
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to generate share code');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate share code');
    }
  };

  const handleShareList = async () => {
    if (!shareCode) {
      await handleGenerateShareCode();
    }

    const shareUrl = `https://hint.com/list/${shareCode}`;
    try {
      await Share.share({
        message: `Check out my wishlist "${name}" on Hint!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled
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
              <Text variant="bodyLarge">
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

          <Divider style={styles.divider} />

          {/* Share Code */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Share Code
          </Text>
          {shareCode ? (
            <Surface style={[styles.shareCodeContainer, { backgroundColor: theme.colors.primaryContainer }]} elevation={0}>
              <Text variant="headlineMedium" style={[styles.shareCode, { color: theme.colors.onPrimaryContainer }]}>
                {shareCode}
              </Text>
              <Button
                mode="contained"
                icon="share-variant"
                onPress={handleShareList}
                style={styles.shareButton}
              >
                Share List
              </Button>
            </Surface>
          ) : (
            <Button
              mode="outlined"
              icon="link-plus"
              onPress={handleGenerateShareCode}
              style={styles.generateButton}
            >
              Generate Share Code
            </Button>
          )}

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
  shareCodeContainer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  shareCode: {
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 12,
  },
  shareButton: {
    width: '100%',
  },
  generateButton: {
    marginBottom: 8,
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
