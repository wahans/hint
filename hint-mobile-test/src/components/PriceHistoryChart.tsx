/**
 * Hint Mobile - Price History Chart
 * Line chart showing price changes over time with target price indicator
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { CartesianChart, Line } from 'victory-native';
import { useTheme } from '../context/ThemeContext';
import { productService } from '../../shared/services';
import type { PriceHistoryEntry } from '../../shared/types';

interface PriceHistoryChartProps {
  productId: string;
  targetPrice?: number | null;
  currentPrice?: number | null;
}

type TimePeriod = '30d' | '90d' | 'all';

const screenWidth = Dimensions.get('window').width;

export default function PriceHistoryChart({ productId, targetPrice, currentPrice }: PriceHistoryChartProps) {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [period, setPeriod] = useState<TimePeriod>('30d');

  useEffect(() => {
    loadPriceHistory();
  }, [productId]);

  const loadPriceHistory = async () => {
    setIsLoading(true);
    try {
      const result = await productService.getPriceHistory(productId);
      if (result.data) {
        setHistory(result.data);
      }
    } catch (error) {
      console.error('Failed to load price history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on selected time period
  const getFilteredData = () => {
    if (history.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (period) {
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        cutoffDate = new Date(0);
        break;
    }

    return history
      .filter(entry => new Date(entry.checked_at) >= cutoffDate)
      .map((entry, index) => ({
        x: index,
        y: entry.price,
        date: new Date(entry.checked_at),
      }));
  };

  const filteredData = getFilteredData();

  // Calculate price range for chart
  const prices = filteredData.map(d => d.y);
  const allPrices = [...prices];
  if (targetPrice) allPrices.push(targetPrice);
  if (currentPrice) allPrices.push(currentPrice);

  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) * 0.9 : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) * 1.1 : 100;

  const chartColors = {
    line: theme.colors.primary,
    target: '#F44336',
    grid: isDark ? '#333' : '#E0E0E0',
    axis: theme.colors.onSurfaceVariant,
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Loading price history...
        </Text>
      </View>
    );
  }

  if (filteredData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
          No price history available yet
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 4 }}>
          Price tracking begins when the product is added
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Time Period Selector */}
      <SegmentedButtons
        value={period}
        onValueChange={(value) => setPeriod(value as TimePeriod)}
        buttons={[
          { value: '30d', label: '30d' },
          { value: '90d', label: '90d' },
          { value: 'all', label: 'All' },
        ]}
        style={styles.segmentedButtons}
        density="small"
      />

      {/* Chart */}
      <View style={styles.chartContainer}>
        <CartesianChart
          data={filteredData}
          xKey="x"
          yKeys={['y']}
          domainPadding={{ left: 10, right: 10, top: 10, bottom: 10 }}
          domain={{ y: [minPrice, maxPrice] }}
        >
          {({ points }) => (
            <Line
              points={points.y}
              color={chartColors.line}
              strokeWidth={2}
              curveType="natural"
            />
          )}
        </CartesianChart>
      </View>

      {/* Price Summary */}
      <View style={styles.priceSummary}>
        {filteredData.length > 0 && (
          <>
            <View style={styles.priceItem}>
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                Lowest
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                ${Math.min(...prices).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                Highest
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                ${Math.max(...prices).toFixed(2)}
              </Text>
            </View>
            {targetPrice && (
              <View style={styles.priceItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                  Target
                </Text>
                <Text variant="bodyMedium" style={{ color: chartColors.target }}>
                  ${targetPrice.toFixed(2)}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  chartContainer: {
    height: 150,
    marginHorizontal: -8,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceItem: {
    alignItems: 'center',
  },
});
