/**
 * Hint Mobile - Loading Skeleton Component
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'list' | 'product';
}

function SkeletonItem({ type }: { type: 'list' | 'product' }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  if (type === 'product') {
    return (
      <Animated.View
        style={[
          styles.productSkeleton,
          { backgroundColor: theme.colors.surfaceVariant, opacity },
        ]}
      >
        <View style={[styles.productImage, { backgroundColor: theme.colors.surface }]} />
        <View style={styles.productInfo}>
          <View style={[styles.textLine, { backgroundColor: theme.colors.surface, width: '80%' }]} />
          <View style={[styles.textLine, { backgroundColor: theme.colors.surface, width: '50%' }]} />
          <View style={[styles.textLine, { backgroundColor: theme.colors.surface, width: '30%' }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.listSkeleton,
        { backgroundColor: theme.colors.surfaceVariant, opacity },
      ]}
    >
      <View style={styles.listContent}>
        <View style={[styles.textLine, { backgroundColor: theme.colors.surface, width: '60%' }]} />
        <View style={[styles.textLine, { backgroundColor: theme.colors.surface, width: '30%', height: 12 }]} />
      </View>
      <View style={[styles.chevron, { backgroundColor: theme.colors.surface }]} />
    </Animated.View>
  );
}

export default function LoadingSkeleton({ count = 3, type = 'list' }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonItem key={index} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  listSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  listContent: {
    flex: 1,
  },
  textLine: {
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  chevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  productSkeleton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
});
