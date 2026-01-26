/**
 * Hint Mobile - Notification Events
 * Event emitter for handling notification navigation from service layer
 */

export type NotificationEventType = 'price_drop' | 'item_claimed' | 'back_in_stock';

export interface NotificationEventData {
  type: NotificationEventType;
  listId?: string;
  productId?: string;
  listName?: string;
}

type NotificationEventHandler = (data: NotificationEventData) => void;

class NotificationEvents {
  private listeners: NotificationEventHandler[] = [];

  /**
   * Subscribe to notification navigation events
   */
  subscribe(handler: NotificationEventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter(l => l !== handler);
    };
  }

  /**
   * Emit a navigation event for a notification
   */
  emit(data: NotificationEventData): void {
    this.listeners.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Notification event handler error:', error);
      }
    });
  }
}

// Export singleton instance
export const notificationEvents = new NotificationEvents();
