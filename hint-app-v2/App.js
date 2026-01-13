import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList,
  ActivityIndicator, Image, Linking, RefreshControl, Modal, KeyboardAvoidingView,
  Platform, Share, ActionSheetIOS, Animated, Dimensions, Switch,
  ScrollView, Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

const supabase = createClient(
  'https://whbqyxtjmbordcjtqyoq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoYnF5eHRqbWJvcmRjanRxeW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMzY0MDksImV4cCI6MjA4MjYxMjQwOX0.GiTCNNNcMVuGdd45AJbXFB6eS0a5enXoUW7nfkZPD3k',
  { auth: { storage: AsyncStorage } }
);

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ============ HELPERS ============
const PRIORITY_COLORS = {
  high: '#dc3545',
  medium: '#ffc107',
  low: '#28a745',
};

const PRIORITY_LABELS = {
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority',
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// ============ THEME CONTEXT ============
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    AsyncStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? {
      background: '#1a1a1a',
      surface: '#2a2a2a',
      card: '#333',
      text: '#fff',
      textSecondary: '#aaa',
      border: '#444',
      primary: '#34d399',
      primaryLight: '#064e3b',
    } : {
      background: '#f0f9f4',
      surface: '#fff',
      card: '#fff',
      text: '#333',
      textSecondary: '#666',
      border: '#e0e0e0',
      primary: '#228855',
      primaryLight: '#d4edda',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

const useTheme = () => useContext(ThemeContext);

// ============ SHARE LIST MODAL ============
function ShareListModal({ visible, onClose, list }) {
  const { colors } = useTheme();

  const copyCode = async () => {
    await Clipboard.setStringAsync(list?.access_code || '');
    Alert.alert('Copied!', 'Access code copied to clipboard');
  };

  const shareList = async () => {
    try {
      await Share.share({
        message: `Check out my wishlist "${list?.name}" on hint!\n\nAccess code: ${list?.access_code}\n\nDownload hint to view: https://wahans.github.io/hint/`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  if (!list) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Share "{list.name}"</Text>

          <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>Access Code</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.codeText, { color: colors.primary }]}>{list.access_code}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.shareHint, { color: colors.textSecondary }]}>
            Share this code with friends so they can view your wishlist
          </Text>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={shareList}>
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============ EDIT LIST MODAL ============
function EditListModal({ visible, onClose, list, onSave, onDelete }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (list) {
      setName(list.name);
      setDescription(list.description || '');
      setDueDate(list.key_date || '');
      setIsPublic(list.is_public);
    }
  }, [list]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }
    setLoading(true);
    await onSave(name.trim(), isPublic, description.trim(), dueDate);
    setLoading(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete }
      ]
    );
  };

  if (!list) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit List</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="List name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={[styles.modalInput, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description or notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 2025-12-25"
              placeholderTextColor={colors.textSecondary}
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Public list</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isPublic ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.background }]} onPress={onClose}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, { backgroundColor: colors.primary }, loading && styles.modalBtnDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.modalCreateText}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.deleteListBtn} onPress={handleDelete}>
              <Text style={styles.deleteListText}>Delete List</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============ ADD FRIEND LIST MODAL ============
function AddFriendListModal({ visible, onClose, onAdd }) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter an access code');
      return;
    }
    setLoading(true);
    await onAdd(code.trim().toUpperCase());
    setLoading(false);
    setCode('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Friend's List</Text>
          <Text style={[styles.shareHint, { color: colors.textSecondary, marginBottom: 16 }]}>
            Enter the access code your friend shared with you
          </Text>

          <TextInput
            style={[styles.modalInput, styles.codeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="ACCESS CODE"
            placeholderTextColor={colors.textSecondary}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoFocus
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.background }]} onPress={onClose}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalCreateBtn, { backgroundColor: colors.primary }, loading && styles.modalBtnDisabled]}
              onPress={handleAdd}
              disabled={loading}
            >
              <Text style={styles.modalCreateText}>{loading ? 'Finding...' : 'Add List'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============ CREATE LIST MODAL ============
function CreateListModal({ visible, onClose, onCreate }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }
    setLoading(true);
    await onCreate(name.trim(), isPublic, description.trim(), dueDate);
    setLoading(false);
    setName('');
    setDescription('');
    setDueDate('');
    setIsPublic(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Hintlist</Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="List name (e.g., Birthday Wishlist)"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description or notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Due Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 2025-12-25"
              placeholderTextColor={colors.textSecondary}
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Make this list public</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isPublic ? colors.primary : '#f4f3f4'}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.background }]} onPress={onClose}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, { backgroundColor: colors.primary }, loading && styles.modalBtnDisabled]}
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.modalCreateText}>{loading ? 'Creating...' : 'Create List'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============ ADD ITEM MODAL ============
function AddItemModal({ visible, onClose, onAdd, listId }) {
  const { colors } = useTheme();
  const [mode, setMode] = useState('manual'); // 'manual' or 'url'
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setPrice('');
    setNotes('');
    setPriority('medium');
    setMode('manual');
  };

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
      setUrl(text);
      fetchProductInfo(text);
    } else if (text) {
      setUrl(text);
    }
  };

  const fetchProductInfo = async (productUrl) => {
    setFetching(true);
    try {
      // Try to extract basic info from URL
      const urlObj = new URL(productUrl);
      const domain = urlObj.hostname.replace('www.', '');

      // For now, just set the URL - in production, you'd call a backend API
      // to scrape product details
      if (!title) {
        // Try to extract title from URL path
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          const cleanTitle = lastPart
            .replace(/[-_]/g, ' ')
            .replace(/\.[^/.]+$/, '')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          setTitle(cleanTitle.substring(0, 50));
        }
      }
    } catch (e) {
      console.log('Error parsing URL:', e);
    }
    setFetching(false);
  };

  const handleAdd = async () => {
    if (!title.trim() && !url.trim()) {
      Alert.alert('Error', 'Please enter a product title or URL');
      return;
    }
    setLoading(true);
    await onAdd({
      title: title.trim() || 'Untitled Item',
      url: url.trim(),
      price: price ? parseFloat(price) : null,
      notes: notes.trim(),
      priority,
      list_id: listId,
    });
    setLoading(false);
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Item</Text>

            {/* Mode Toggle */}
            <View style={[styles.modeToggle, { backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'manual' && { backgroundColor: colors.primary }]}
                onPress={() => setMode('manual')}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'manual' ? 'white' : colors.text }]}>Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'url' && { backgroundColor: colors.primary }]}
                onPress={() => setMode('url')}
              >
                <Text style={[styles.modeBtnText, { color: mode === 'url' ? 'white' : colors.text }]}>From URL</Text>
              </TouchableOpacity>
            </View>

            {mode === 'url' && (
              <View style={styles.urlSection}>
                <View style={styles.urlInputRow}>
                  <TextInput
                    style={[styles.modalInput, styles.urlInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                    placeholder="Paste product URL"
                    placeholderTextColor={colors.textSecondary}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  <TouchableOpacity style={[styles.pasteBtn, { backgroundColor: colors.primary }]} onPress={pasteFromClipboard}>
                    <Text style={styles.pasteBtnText}>Paste</Text>
                  </TouchableOpacity>
                </View>
                {fetching && <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />}
              </View>
            )}

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Product title"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Price (optional)"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={[styles.modalInput, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />

            {/* Priority Selector */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.priorityRow}>
              {['high', 'medium', 'low'].map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityBtn,
                    { borderColor: PRIORITY_COLORS[p] },
                    priority === p && { backgroundColor: PRIORITY_COLORS[p] }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityBtnText, { color: priority === p ? 'white' : PRIORITY_COLORS[p] }]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: colors.background }]} onPress={() => { resetForm(); onClose(); }}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCreateBtn, { backgroundColor: colors.primary }, loading && styles.modalBtnDisabled]}
                onPress={handleAdd}
                disabled={loading}
              >
                <Text style={styles.modalCreateText}>{loading ? 'Adding...' : 'Add Item'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============ PRODUCT DETAIL MODAL ============
function ProductDetailModal({ visible, onClose, product, onDelete, onTogglePurchased, onUpdatePriority, isFriendsList }) {
  const { colors } = useTheme();
  if (!product) return null;

  const priceHistory = product.price_history ? JSON.parse(product.price_history) : [];
  const priceChange = priceHistory.length > 1
    ? priceHistory[priceHistory.length - 1].price - priceHistory[priceHistory.length - 2].price
    : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.detailModal, { backgroundColor: colors.background }]}>
        <View style={[styles.detailHeader, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onClose} style={styles.detailCloseBtn}>
            <Text style={styles.detailCloseBtnText}>Done</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Product Details</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={styles.detailContent}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={styles.detailImage} resizeMode="contain" />
          ) : (
            <View style={[styles.detailImagePlaceholder, { backgroundColor: colors.card }]}>
              <Text style={{ fontSize: 64 }}>🎁</Text>
            </View>
          )}

          <View style={styles.detailInfo}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>{product.title || product.name || 'Untitled'}</Text>

            {product.url && (
              <TouchableOpacity onPress={() => Linking.openURL(product.url)}>
                <Text style={[styles.detailUrl, { color: colors.primary }]}>
                  {(() => { try { return new URL(product.url).hostname.replace('www.', ''); } catch { return 'View Product'; } })()}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.detailPriceRow}>
              {(product.price || product.current_price) && (
                <Text style={[styles.detailPrice, { color: colors.primary }]}>
                  ${product.price || product.current_price}
                </Text>
              )}
              {priceChange !== 0 && (
                <View style={[styles.priceChangeBadge, { backgroundColor: priceChange < 0 ? '#d4edda' : '#f8d7da' }]}>
                  <Text style={{ color: priceChange < 0 ? '#155724' : '#721c24', fontWeight: '600' }}>
                    {priceChange < 0 ? '↓' : '↑'} ${Math.abs(priceChange).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {product.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[product.priority] + '20', borderColor: PRIORITY_COLORS[product.priority] }]}>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[product.priority] }]} />
                <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLORS[product.priority] }]}>
                  {PRIORITY_LABELS[product.priority]}
                </Text>
              </View>
            )}

            {product.notes && (
              <View style={[styles.detailNotesBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.detailNotesLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={[styles.detailNotes, { color: colors.text }]}>{product.notes}</Text>
              </View>
            )}

            {/* Price History */}
            {priceHistory.length > 0 && (
              <View style={[styles.priceHistoryBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.priceHistoryTitle, { color: colors.text }]}>Price History</Text>
                {priceHistory.slice(-5).reverse().map((entry, index) => (
                  <View key={index} style={styles.priceHistoryRow}>
                    <Text style={[styles.priceHistoryDate, { color: colors.textSecondary }]}>
                      {formatDate(entry.date)}
                    </Text>
                    <Text style={[styles.priceHistoryPrice, { color: colors.text }]}>
                      ${entry.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!isFriendsList && (
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: colors.card }]}
                  onPress={() => { onTogglePurchased(); onClose(); }}
                >
                  <Text style={[styles.detailActionText, { color: colors.text }]}>
                    {product.is_purchased ? '✓ Mark as Not Purchased' : '✓ Mark as Purchased'}
                  </Text>
                </TouchableOpacity>

                {product.url && (
                  <TouchableOpacity
                    style={[styles.detailActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(product.url)}
                  >
                    <Text style={[styles.detailActionText, { color: 'white' }]}>Open in Browser</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.detailActionBtn, { backgroundColor: '#dc3545' }]}
                  onPress={() => {
                    Alert.alert('Delete Item', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose(); } }
                    ]);
                  }}
                >
                  <Text style={[styles.detailActionText, { color: 'white' }]}>Delete Item</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ============ PRODUCT CARD ============
function ProductCard({ product, onPress, onDelete, onTogglePurchased, showClaimButton, onClaim, isFriendsList, currentUserId }) {
  const { colors } = useTheme();
  const isPurchased = product.is_purchased;
  const isClaimed = !!product.claimed_by;
  const isClaimedByMe = product.claimed_by === currentUserId;
  const hasPriceAlert = product.target_price && product.current_price && product.current_price <= product.target_price;

  const handleLongPress = () => {
    if (isFriendsList) return;

    const options = ['Cancel', 'Delete Item'];
    if (!isPurchased) options.push('Mark as Purchased');
    else options.push('Mark as Not Purchased');

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: 1,
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) onDelete?.();
        if (buttonIndex === 2) onTogglePurchased?.();
      }
    );
  };

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.card }, isPurchased && styles.productCardPurchased]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      {/* Priority indicator */}
      {product.priority && (
        <View style={[styles.priorityStripe, { backgroundColor: PRIORITY_COLORS[product.priority] }]} />
      )}

      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: colors.background }]}>
          <Text style={styles.placeholderIcon}>🎁</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }, isPurchased && styles.productNamePurchased]} numberOfLines={2}>
          {product.title || product.name || 'Untitled'}
        </Text>
        {product.url && (
          <Text style={[styles.productDomain, { color: colors.textSecondary }]} numberOfLines={1}>
            {(() => { try { return new URL(product.url).hostname.replace('www.', ''); } catch { return ''; } })()}
          </Text>
        )}
        <View style={styles.priceRow}>
          {(product.price || product.current_price) && (
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ${product.price || product.current_price}
            </Text>
          )}
          {hasPriceAlert && (
            <View style={[styles.alertBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.alertBadgeText, { color: colors.primary }]}>Price Drop!</Text>
            </View>
          )}
        </View>
        {product.notes && (
          <Text style={[styles.productNotes, { color: colors.textSecondary }]} numberOfLines={2}>{product.notes}</Text>
        )}

        {/* Status badges */}
        <View style={styles.badgeRow}>
          {isPurchased && (
            <View style={[styles.statusBadge, { backgroundColor: '#d4edda' }]}>
              <Text style={styles.statusBadgeText}>Purchased</Text>
            </View>
          )}
          {isClaimed && (
            <View style={[styles.statusBadge, { backgroundColor: '#fff3cd' }]}>
              <Text style={styles.statusBadgeText}>{isClaimedByMe ? 'You claimed this' : 'Claimed'}</Text>
            </View>
          )}
        </View>

        {/* Claim button for friends' lists */}
        {showClaimButton && !isPurchased && (
          <TouchableOpacity
            style={[styles.claimButton, isClaimed && isClaimedByMe && styles.claimButtonActive]}
            onPress={onClaim}
          >
            <Text style={styles.claimButtonText}>
              {isClaimedByMe ? 'Unclaim' : isClaimed ? 'Claimed by someone' : 'Claim this gift'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============ LIST DETAIL SCREEN ============
function ListDetailScreen({ route, navigation }) {
  const { list: initialList, isFriendsList, currentUserId } = route.params;
  const { colors } = useTheme();
  const [list, setList] = useState(initialList);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('list_id', list.id)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {!isFriendsList && (
            <>
              <TouchableOpacity onPress={() => setShowShareModal(true)} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 20 }}>📤</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEditModal(true)}>
                <Text style={{ fontSize: 20 }}>•••</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [navigation, isFriendsList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, []);

  const handleAddItem = async (itemData) => {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        ...itemData,
        current_price: itemData.price,
        price_history: itemData.price ? JSON.stringify([{ date: new Date().toISOString(), price: itemData.price }]) : null,
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProducts([data, ...products]);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleTogglePurchased = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_purchased: !product.is_purchased })
      .eq('id', product.id);
    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_purchased: !p.is_purchased } : p));
    }
  };

  const handleClaimProduct = async (product) => {
    const newClaimedBy = product.claimed_by === currentUserId ? null : currentUserId;
    const { error } = await supabase
      .from('products')
      .update({ claimed_by: newClaimedBy })
      .eq('id', product.id);
    if (!error) {
      setProducts(products.map(p => p.id === product.id ? { ...p, claimed_by: newClaimedBy } : p));
    }
  };

  const handleSaveList = async (name, isPublic, description, dueDate) => {
    const { error } = await supabase
      .from('lists')
      .update({ name, is_public: isPublic, description, key_date: dueDate || null })
      .eq('id', list.id);
    if (!error) {
      setList({ ...list, name, is_public: isPublic, description, key_date: dueDate });
      navigation.setOptions({ title: name });
      setShowEditModal(false);
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteList = async () => {
    const { error } = await supabase.from('lists').delete().eq('id', list.id);
    if (!error) {
      navigation.goBack();
    } else {
      Alert.alert('Error', error.message);
    }
  };

  const filteredProducts = products.filter(p =>
    (p.title || p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by priority
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority] ?? 1;
    const bPriority = priorityOrder[b.priority] ?? 1;
    return aPriority - bPriority;
  });

  const daysUntil = getDaysUntil(list.key_date);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* List header with description and due date */}
      {(list.description || list.key_date) && (
        <View style={[styles.listHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {list.description && (
            <Text style={[styles.listDescription, { color: colors.textSecondary }]}>{list.description}</Text>
          )}
          {list.key_date && (
            <View style={styles.dueDateRow}>
              <Text style={[styles.dueDateText, { color: daysUntil <= 7 ? '#dc3545' : colors.primary }]}>
                {daysUntil === 0 ? 'Due today!' : daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
              </Text>
              <Text style={[styles.dueDateActual, { color: colors.textSecondary }]}>
                Due: {formatDate(list.key_date)}
              </Text>
            </View>
          )}
        </View>
      )}

      {products.length > 3 && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search items..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>No items yet!</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {isFriendsList ? 'This list is empty' : 'Add items using the + button below'}
          </Text>
          {!isFriendsList && (
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddItemModal(true)}>
              <Text style={styles.emptyButtonText}>Add Item</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => setShowProductDetail(item)}
              onDelete={() => handleDeleteProduct(item.id)}
              onTogglePurchased={() => handleTogglePurchased(item)}
              showClaimButton={isFriendsList}
              onClaim={() => handleClaimProduct(item)}
              isFriendsList={isFriendsList}
              currentUserId={currentUserId}
            />
          )}
        />
      )}

      {/* Add Item FAB */}
      {!isFriendsList && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowAddItemModal(true)}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <ShareListModal visible={showShareModal} onClose={() => setShowShareModal(false)} list={list} />
      <EditListModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        list={list}
        onSave={handleSaveList}
        onDelete={handleDeleteList}
      />
      <AddItemModal
        visible={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItem}
        listId={list.id}
      />
      <ProductDetailModal
        visible={!!showProductDetail}
        onClose={() => setShowProductDetail(null)}
        product={showProductDetail}
        onDelete={() => handleDeleteProduct(showProductDetail?.id)}
        onTogglePurchased={() => handleTogglePurchased(showProductDetail)}
        isFriendsList={isFriendsList}
      />
    </View>
  );
}

// ============ LISTS SCREEN ============
function ListsScreen({ navigation, user }) {
  const { colors } = useTheme();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLists = async () => {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setLists(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLists();
  }, []);

  const handleCreateList = async (name, isPublic, description, dueDate) => {
    const { data, error } = await supabase
      .from('lists')
      .insert([{
        name,
        is_public: isPublic,
        description,
        key_date: dueDate || null,
        user_id: user.id,
        access_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      }])
      .select()
      .single();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowCreateModal(false);
      fetchLists();
    }
  };

  const filteredLists = lists.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {lists.length > 3 && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search lists..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>No hintlists yet!</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create your first wishlist to start tracking products
          </Text>
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.emptyButtonText}>Create List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredLists}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const daysUntil = getDaysUntil(item.key_date);
            return (
              <TouchableOpacity
                style={[styles.listCard, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('ListDetail', { list: item, currentUserId: user.id })}
              >
                <View style={styles.listCardContent}>
                  <Text style={[styles.listName, { color: colors.text }]}>{item.name}</Text>
                  {item.description && (
                    <Text style={[styles.listDescriptionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={[styles.listMeta, { color: daysUntil !== null && daysUntil <= 7 ? '#dc3545' : colors.textSecondary }]}>
                    {item.key_date
                      ? (daysUntil === 0 ? 'Due today!' : daysUntil < 0 ? 'Overdue' : `${daysUntil} days left`)
                      : 'No due date'}
                  </Text>
                </View>
                <View style={[styles.badge, item.is_public ? styles.badgePublic : { backgroundColor: colors.background }]}>
                  <Text style={[styles.badgeText, { color: colors.text }]}>{item.is_public ? 'public' : 'private'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <CreateListModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateList} />
    </View>
  );
}

// ============ LISTS STACK ============
function ListsStack({ user }) {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="MyLists" options={{ title: 'My Hintlists' }}>
        {(props) => <ListsScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="ListDetail"
        options={({ route }) => ({ title: route.params.list.name })}
        component={ListDetailScreen}
      />
    </Stack.Navigator>
  );
}

// ============ FRIENDS SCREEN ============
function FriendsScreen({ user, navigation }) {
  const { colors } = useTheme();
  const [friendLists, setFriendLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchFriendLists = async () => {
    // Get saved friend list IDs from local storage
    const savedIds = await AsyncStorage.getItem('friendListIds');
    const ids = savedIds ? JSON.parse(savedIds) : [];

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('lists')
        .select('*, users:user_id(email)')
        .in('id', ids);

      if (data) setFriendLists(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFriendLists();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFriendLists();
  }, []);

  const handleAddFriendList = async (code) => {
    const { data, error } = await supabase
      .from('lists')
      .select('*, users:user_id(email)')
      .eq('access_code', code)
      .single();

    if (error || !data) {
      Alert.alert('Not Found', 'No list found with that access code');
      return;
    }

    if (data.user_id === user.id) {
      Alert.alert('Oops', "That's your own list!");
      return;
    }

    // Save to local storage
    const savedIds = await AsyncStorage.getItem('friendListIds');
    const ids = savedIds ? JSON.parse(savedIds) : [];
    if (!ids.includes(data.id)) {
      ids.push(data.id);
      await AsyncStorage.setItem('friendListIds', JSON.stringify(ids));
    }

    setFriendLists([...friendLists.filter(l => l.id !== data.id), data]);
    setShowAddModal(false);
    Alert.alert('Success', `Added "${data.name}" to your friends' lists!`);
  };

  const removeFriendList = async (listId) => {
    const savedIds = await AsyncStorage.getItem('friendListIds');
    const ids = savedIds ? JSON.parse(savedIds) : [];
    const newIds = ids.filter(id => id !== listId);
    await AsyncStorage.setItem('friendListIds', JSON.stringify(newIds));
    setFriendLists(friendLists.filter(l => l.id !== listId));
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {friendLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyText, { color: colors.text }]}>No friends' lists yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add a friend's list using their access code
          </Text>
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyButtonText}>Add Friend's List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friendLists}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.listCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('ListDetail', { list: item, isFriendsList: true, currentUserId: user.id })}
            >
              <View style={styles.listCardContent}>
                <Text style={[styles.listName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                  From: {item.users?.email || 'Unknown'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFriendList(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowAddModal(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddFriendListModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddFriendList} />
    </View>
  );
}

// ============ FRIENDS STACK ============
function FriendsStack({ user }) {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="FriendsLists" options={{ title: "Friends' Lists" }}>
        {(props) => <FriendsScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen
        name="ListDetail"
        options={({ route }) => ({ title: route.params.list.name })}
        component={ListDetailScreen}
      />
    </Stack.Navigator>
  );
}

// ============ LEADERBOARD SCREEN ============
function LeaderboardScreen({ user }) {
  const { colors } = useTheme();
  const [stats, setStats] = useState({ listsCreated: 0, itemsAdded: 0, itemsClaimed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: lists } = await supabase.from('lists').select('id').eq('user_id', user.id);
    const { data: products } = await supabase.from('products').select('id').in('list_id', lists?.map(l => l.id) || []);
    const { data: claimed } = await supabase.from('products').select('id').eq('claimed_by', user.id);

    setStats({
      listsCreated: lists?.length || 0,
      itemsAdded: products?.length || 0,
      itemsClaimed: claimed?.length || 0,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardIcon}>🏆</Text>
        <Text style={[styles.leaderboardTitle, { color: colors.text }]}>Your Stats</Text>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={styles.statEmoji}>📝</Text>
        <View style={styles.statInfo}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.listsCreated}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lists Created</Text>
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={styles.statEmoji}>🎁</Text>
        <View style={styles.statInfo}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.itemsAdded}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items Added</Text>
        </View>
      </View>

      <View style={[styles.statCard, { backgroundColor: colors.card }]}>
        <Text style={styles.statEmoji}>🤝</Text>
        <View style={styles.statInfo}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.itemsClaimed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gifts Claimed</Text>
        </View>
      </View>

      <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
        More leaderboard features coming soon!
      </Text>
    </ScrollView>
  );
}

// ============ SETTINGS SCREEN ============
function SettingsScreen({ user, onSignOut }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('notificationsEnabled').then(val => {
      setNotificationsEnabled(val === 'true');
    });
  }, []);

  const toggleNotifications = async () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    await AsyncStorage.setItem('notificationsEnabled', newVal ? 'true' : 'false');
    if (newVal) {
      Alert.alert('Notifications', 'You will receive reminders for lists with due dates and price drop alerts.');
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>Account</Text>
        <Text style={[styles.settingsValue, { color: colors.text }]}>{user.email}</Text>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.settingsRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingsRowText, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>Notifications</Text>
        <View style={[styles.settingsRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingsRowText, { color: colors.text }]}>Enable Reminders</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
          />
        </View>
        <Text style={[styles.settingsHint, { color: colors.textSecondary }]}>
          Get alerts for due dates and price drops
        </Text>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsLabel, { color: colors.textSecondary }]}>About</Text>
        <View style={[styles.settingsRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.settingsRowText, { color: colors.text }]}>Version</Text>
          <Text style={[styles.settingsRowValue, { color: colors.textSecondary }]}>1.0.0</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsRow, { borderTopColor: colors.border }]}
          onPress={() => Linking.openURL('https://wahans.github.io/hint/')}
        >
          <Text style={[styles.settingsRowText, { color: colors.text }]}>Website</Text>
          <Text style={[styles.settingsArrow, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============ LOGIN SCREEN ============
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      onLogin(data.user);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Check your email to confirm your account!');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <Text style={styles.title}>hint</Text>
      <Text style={styles.subtitle}>Your wishlist companion</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonOutline} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonOutlineText}>Create Account</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="light" />
    </View>
  );
}

// ============ MAIN APP ============
function MainApp({ user, onSignOut }) {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ListsTab"
        options={{
          tabBarLabel: 'My Lists',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📝</Text>
        }}
      >
        {() => <ListsStack user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="FriendsTab"
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
        }}
      >
        {() => <FriendsStack user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="LeaderboardTab"
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏆</Text>,
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: 'white',
          title: 'Your Stats'
        }}
      >
        {() => <LeaderboardScreen user={user} />}
      </Tab.Screen>
      <Tab.Screen
        name="SettingsTab"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: 'white',
          title: 'Settings'
        }}
      >
        {() => <SettingsScreen user={user} onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ============ ROOT APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#f0f9f4' }]}>
        <ActivityIndicator size="large" color="#228855" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent user={user} onLogin={setUser} onSignOut={handleSignOut} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent({ user, onLogin, onSignOut }) {
  const { colors, isDark } = useTheme();

  if (!user) {
    return <LoginScreen onLogin={onLogin} />;
  }

  return (
    <NavigationContainer
      theme={isDark ? DarkTheme : DefaultTheme}
    >
      <MainApp user={user} onSignOut={onSignOut} />
    </NavigationContainer>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContainer: { flex: 1, backgroundColor: '#228855', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 64, fontWeight: '300', color: 'white' },
  subtitle: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 10, marginBottom: 40 },
  form: { width: '100%', maxWidth: 320 },
  input: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 15, marginBottom: 15, color: 'white', fontSize: 16 },
  button: { backgroundColor: 'white', borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: '#228855', fontSize: 16, fontWeight: '600' },
  buttonOutline: { borderWidth: 2, borderColor: 'white', borderRadius: 8, padding: 15, alignItems: 'center' },
  buttonOutlineText: { color: 'white', fontSize: 16, fontWeight: '600' },
  screen: { flex: 1, padding: 16 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },

  // Empty State
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  emptyButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },

  // List Cards
  listCard: { padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  listCardContent: { flex: 1 },
  listName: { fontSize: 18, fontWeight: '600' },
  listDescriptionPreview: { fontSize: 13, marginTop: 2 },
  listMeta: { fontSize: 14, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePublic: { backgroundColor: '#d4edda' },
  badgeText: { fontSize: 12, fontWeight: '500' },

  // List Header
  listHeader: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  listDescription: { fontSize: 14, marginBottom: 8 },
  dueDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDateText: { fontSize: 14, fontWeight: '600' },
  dueDateActual: { fontSize: 12 },

  // Product Cards
  productCard: { borderRadius: 12, marginBottom: 12, flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, overflow: 'hidden' },
  productCardPurchased: { opacity: 0.6 },
  priorityStripe: { width: 4, position: 'absolute', left: 0, top: 0, bottom: 0 },
  productImage: { width: 100, height: 100 },
  productImagePlaceholder: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 32 },
  productInfo: { flex: 1, padding: 12, paddingLeft: 16 },
  productName: { fontSize: 16, fontWeight: '600' },
  productNamePurchased: { textDecorationLine: 'line-through' },
  productDomain: { fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 8 },
  productPrice: { fontSize: 18, fontWeight: '700' },
  productNotes: { fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  alertBadgeText: { fontSize: 12, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '500' },
  claimButton: { marginTop: 8, backgroundColor: '#228855', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  claimButtonActive: { backgroundColor: '#dc3545' },
  claimButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Priority
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 2, alignItems: 'center' },
  priorityBtnText: { fontWeight: '600' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  priorityBadgeText: { fontSize: 12, fontWeight: '500' },

  // FAB
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  fabIcon: { fontSize: 32, color: 'white', marginTop: -2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  modalInput: { borderRadius: 10, padding: 16, fontSize: 16, marginBottom: 16, borderWidth: 1 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  inputLabel: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  codeInput: { textAlign: 'center', fontSize: 24, letterSpacing: 4 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toggleLabel: { fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600' },
  modalCreateBtn: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center' },
  modalCreateText: { fontSize: 16, fontWeight: '600', color: 'white' },
  modalBtnDisabled: { opacity: 0.6 },
  modalCloseBtn: { marginTop: 16, alignItems: 'center' },
  modalCloseText: { fontSize: 16 },
  deleteListBtn: { marginTop: 20, alignItems: 'center' },
  deleteListText: { color: '#dc3545', fontSize: 16, fontWeight: '600' },

  // Add Item Modal
  modeToggle: { flexDirection: 'row', borderRadius: 10, padding: 4, marginBottom: 16 },
  modeBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  modeBtnText: { fontWeight: '600' },
  urlSection: { marginBottom: 8 },
  urlInputRow: { flexDirection: 'row', gap: 8 },
  urlInput: { flex: 1, marginBottom: 8 },
  pasteBtn: { padding: 16, borderRadius: 10, justifyContent: 'center' },
  pasteBtnText: { color: 'white', fontWeight: '600' },

  // Share Modal
  shareLabel: { fontSize: 14, marginBottom: 8 },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  codeText: { fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  copyBtn: { backgroundColor: '#228855', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  copyBtnText: { color: 'white', fontWeight: '600' },
  shareHint: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  shareButton: { padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  shareButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Product Detail Modal
  detailModal: { flex: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60 },
  detailCloseBtn: { width: 50 },
  detailCloseBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  detailHeaderTitle: { color: 'white', fontSize: 18, fontWeight: '600' },
  detailContent: { flex: 1 },
  detailImage: { width: '100%', height: 300 },
  detailImagePlaceholder: { width: '100%', height: 200, justifyContent: 'center', alignItems: 'center' },
  detailInfo: { padding: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  detailUrl: { fontSize: 14, marginBottom: 12 },
  detailPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailPrice: { fontSize: 28, fontWeight: '700' },
  priceChangeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  detailNotesBox: { padding: 16, borderRadius: 12, marginTop: 16 },
  detailNotesLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 8 },
  detailNotes: { fontSize: 16 },
  priceHistoryBox: { padding: 16, borderRadius: 12, marginTop: 16 },
  priceHistoryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  priceHistoryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  priceHistoryDate: { fontSize: 14 },
  priceHistoryPrice: { fontSize: 14, fontWeight: '600' },
  detailActions: { marginTop: 24, gap: 12 },
  detailActionBtn: { padding: 16, borderRadius: 10, alignItems: 'center' },
  detailActionText: { fontSize: 16, fontWeight: '600' },

  // Friends
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 18, color: '#999' },

  // Leaderboard
  leaderboardHeader: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  leaderboardIcon: { fontSize: 48 },
  leaderboardTitle: { fontSize: 24, fontWeight: '700', marginTop: 8 },
  statCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 12, marginBottom: 12 },
  statEmoji: { fontSize: 36, marginRight: 16 },
  statInfo: { flex: 1 },
  statNumber: { fontSize: 32, fontWeight: '700' },
  statLabel: { fontSize: 14, marginTop: 2 },
  comingSoon: { textAlign: 'center', marginTop: 24, fontSize: 14 },

  // Settings
  settingsCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
  settingsLabel: { fontSize: 12, textTransform: 'uppercase', marginBottom: 8 },
  settingsValue: { fontSize: 16 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1 },
  settingsRowText: { fontSize: 16 },
  settingsRowValue: { fontSize: 16 },
  settingsArrow: { fontSize: 20 },
  settingsHint: { fontSize: 12, marginTop: 8 },
  signOutButton: { backgroundColor: '#dc3545', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  signOutText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
