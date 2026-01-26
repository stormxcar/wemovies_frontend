import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { toast } from "react-hot-toast";

class NotificationService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.onNewNotificationCallbacks = [];
    this.onUnreadCountUpdateCallbacks = [];
    this.pollingInterval = null;
    this.lastKnownUnreadCount = undefined;
    // Flag to enable/disable WebSocket (set to false if backend doesn't support WebSocket)
    this.websocketEnabled = true; // Set to true to enable WebSocket

    // Performance optimization - throttle callbacks
    this.throttleDelay = 100;
    this.lastCallbackTime = 0;
  }

  connect(userId, token) {
    return new Promise((resolve, reject) => {
      // Check if WebSocket is enabled
      if (!this.websocketEnabled) {
        resolve("WebSocket disabled");
        return;
      }

      try {
        const socket = new SockJS(
          "https://wemovies-backend.onrender.com/ws-notifications",
        );
        this.stompClient = Stomp.over(() => socket);

        // Configure STOMP client
        this.stompClient.debug = () => {}; // Disable debug logging

        // Set heartbeat
        this.stompClient.heartbeat.outgoing = 20000;
        this.stompClient.heartbeat.incoming = 0;

        this.stompClient.connect(
          {
            Authorization: `Bearer ${token}`,
            "X-User-Id": userId,
          },
          (frame) => {
            this.connected = true;
            this.reconnectAttempts = 0;

            // Wait a bit for connection to be fully established
            setTimeout(() => {
              if (this.stompClient && this.stompClient.connected) {
                this.setupSubscriptions(userId);
              } else {
              }
            }, 100);

            resolve(frame);
          },
          (error) => {
            this.connected = false;

            // Auto-reconnect logic
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(userId, token);
              }, this.reconnectDelay);
            } else {
              reject(error);
            }
          },
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  setupSubscriptions(userId) {
    // Check if STOMP client is connected
    if (!this.stompClient || !this.stompClient.connected) {
      return;
    }

    // Clear existing subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    try {
      // Subscribe to general notifications - backend @SendTo("/topic/notifications")
      const notificationSub = this.stompClient.subscribe(
        "/topic/notifications",
        (message) => {
          try {
            let notification;
            try {
              notification = JSON.parse(message.body);

              // Skip subscription confirmation messages
              if (notification.type === "SUBSCRIPTION_CONFIRMED") {
                return;
              }
            } catch (jsonError) {
              return;
            }

            // Use requestIdleCallback for performance optimization
            if (typeof requestIdleCallback !== "undefined") {
              requestIdleCallback(
                () => {
                  this.handleNewNotification(notification);
                },
                { timeout: 100 },
              );
            } else {
              setTimeout(() => {
                this.handleNewNotification(notification);
              }, 0);
            }
          } catch (error) {
            // Silent error handling
          }
        },
      );

      // Subscribe to user-specific notifications
      const userNotificationSub = this.stompClient.subscribe(
        "/user/queue/notifications",
        (message) => {
          try {
            let notification;
            try {
              notification = JSON.parse(message.body);

              // Skip subscription confirmation messages
              if (notification.type === "SUBSCRIPTION_CONFIRMED") {
                return;
              }
            } catch (jsonError) {
              return;
            }

            this.handleNewNotification(notification);
          } catch (error) {
            // Silent error handling
          }
        },
      );

      // Subscribe to broadcast notifications (new movies, announcements)
      const broadcastSub = this.stompClient.subscribe(
        "/topic/broadcast",
        (message) => {
          try {
            const notification = JSON.parse(message.body);
            // Use requestIdleCallback for performance optimization
            if (typeof requestIdleCallback !== "undefined") {
              requestIdleCallback(
                () => {
                  this.handleNewNotification(notification);
                },
                { timeout: 100 },
              );
            } else {
              setTimeout(() => {
                this.handleNewNotification(notification);
              }, 0);
            }
          } catch (error) {
            // Silent error handling
          }
        },
      );

      // Subscribe to movie-specific notifications
      const movieSub = this.stompClient.subscribe(
        "/topic/movies",
        (message) => {
          try {
            const notification = JSON.parse(message.body);
            // Use requestIdleCallback for performance optimization
            if (typeof requestIdleCallback !== "undefined") {
              requestIdleCallback(
                () => {
                  this.handleNewNotification(notification);
                },
                { timeout: 100 },
              );
            } else {
              setTimeout(() => {
                this.handleNewNotification(notification);
              }, 0);
            }
          } catch (error) {
            // Silent error handling
          }
        },
      );

      // Subscribe to unread count updates
      const countSub = this.stompClient.subscribe(
        "/user/queue/unread-count",
        (message) => {
          try {
            const data = JSON.parse(message.body);
            // Use requestIdleCallback for performance optimization
            if (typeof requestIdleCallback !== "undefined") {
              requestIdleCallback(
                () => {
                  this.handleUnreadCountUpdate(data.count);
                },
                { timeout: 100 },
              );
            } else {
              setTimeout(() => {
                this.handleUnreadCountUpdate(data.count);
              }, 0);
            }
          } catch (error) {
            // Silent error handling
          }
        },
      );

      this.subscriptions.push(
        notificationSub,
        userNotificationSub,
        broadcastSub,
        movieSub,
        countSub,
      );

      // Send subscription message to backend
      this.stompClient.send("/app/notifications.subscribe", {}, userId);

      // Setup polling fallback - check for new notifications every 30 seconds
      this.setupPollingFallback(userId);
    } catch (error) {
      // Silent error handling
    }
  }

  setupPollingFallback(userId) {
    // Clear existing polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Setup polling every 30 seconds as fallback
    this.pollingInterval = setInterval(async () => {
      try {
        // Get current notification count from API
        const response = await fetch("/api/notifications/unread-count", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const currentCount = data.data?.unreadCount || 0;

          // Compare with last known count
          if (
            this.lastKnownUnreadCount !== undefined &&
            currentCount > this.lastKnownUnreadCount
          ) {
            // Fetch recent notifications to get the new ones
            const notificationsResponse = await fetch(
              "/api/notifications?page=0&size=5",
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
                },
              },
            );

            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json();
              const notifications = notificationsData.data?.content || [];

              // Show the most recent unread notification
              const newNotifications = notifications.filter((n) => !n.isRead);
              if (newNotifications.length > 0) {
                const newest = newNotifications[0];
                this.handleNewNotification(newest);
              }
            }
          }

          this.lastKnownUnreadCount = currentCount;
        }
      } catch (error) {
        // Silent polling error
      }
    }, 30000); // Poll every 30 seconds
  }

  handleNewNotification(notification) {
    // Ensure notification has proper structure
    const processedNotification = {
      id: notification.id || Date.now().toString(),
      title: notification.title || notification.message || "New Notification",
      message:
        notification.message ||
        notification.title ||
        "You have a new notification",
      type: notification.type || "GENERAL",
      typeIcon: this.getNotificationIcon(notification.type),
      isRead: notification.isRead || false,
      readAt: notification.readAt || null,
      createdAt:
        notification.createdAt ||
        notification.timestamp ||
        new Date().toISOString(),
      actionUrl: notification.actionUrl || null,
      metadata: notification.metadata || {},
      isNew: true, // Mark as new for UI highlighting
    };

    // Show browser notification
    this.showBrowserNotification(processedNotification);

    // Play sound
    this.playNotificationSound();

    // Show toast notification
    toast.success(
      `${processedNotification.typeIcon} ${processedNotification.title}\n${processedNotification.message}`,
      {
        duration: 4000,
        position: "top-right",
      },
    );

    // Notify listeners with processed notification - use requestIdleCallback for performance
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          this.onNewNotificationCallbacks.forEach((callback) => {
            try {
              callback(processedNotification);
            } catch (error) {
              // Silent error handling
            }
          });
        },
        { timeout: 100 },
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.onNewNotificationCallbacks.forEach((callback) => {
          try {
            callback(processedNotification);
          } catch (error) {
            // Silent error handling
          }
        });
      }, 0);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      NEW_MOVIE: "🎬",
      MOVIE_AVAILABLE: "🆕",
      WATCHING_PROGRESS: "⏱️",
      MOVIE_RECOMMENDATION: "⭐",
      SYSTEM: "🔔",
      ADMIN: "👨‍💼",
      GENERAL: "📢",
      TEST: "🧪",
    };
    return icons[type] || "🔔";
  }

  handleUnreadCountUpdate(count) {
    // Skip if count hasn't changed to prevent unnecessary re-renders
    if (count === this.lastKnownUnreadCount) {
      return;
    }
    this.lastKnownUnreadCount = count;

    // Use requestIdleCallback for performance optimization
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(
        () => {
          this.onUnreadCountUpdateCallbacks.forEach((callback) => {
            try {
              callback(count);
            } catch (error) {
              // Silent error handling
            }
          });
        },
        { timeout: 100 },
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.onUnreadCountUpdateCallbacks.forEach((callback) => {
          try {
            callback(count);
          } catch (error) {
            // Silent error handling
          }
        });
      }, 0);
    }
  }

  showBrowserNotification(notification) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
          requireInteraction: false,
          silent: false,
        });

        browserNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          browserNotification.close();
        };

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.showBrowserNotification(notification);
          }
        });
      }
    }
  }

  playNotificationSound() {
    try {
      // Create audio element for notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSmF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMFLIHO8tiJOQcZZ7zs4Z5NEAxPqOPwtmMcBjiP2PLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBSuF0fPAciMF",
      );
      audio.volume = 0.1;
      audio.play().catch(() => {}); // Silent audio error
    } catch (error) {
      // Silent notification sound error
    }
  }

  disconnect() {
    if (!this.websocketEnabled) return;

    // Clear polling fallback
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.stompClient && this.connected) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions = [];
      this.stompClient.disconnect(() => {
        // Silent disconnect
      });
      this.connected = false;
    }
  }

  // Send test message (for development)
  sendTestMessage(message) {
    if (!this.websocketEnabled) {
      return;
    }

    if (this.stompClient && this.connected) {
      this.stompClient.send(
        "/app/notifications.test",
        {},
        JSON.stringify({
          message: message,
        }),
      );
    }
  }

  // Register callbacks
  onNewNotification(callback) {
    this.onNewNotificationCallbacks.push(callback);
    return () => {
      this.onNewNotificationCallbacks = this.onNewNotificationCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onUnreadCountUpdate(callback) {
    this.onUnreadCountUpdateCallbacks.push(callback);
    return () => {
      this.onUnreadCountUpdateCallbacks =
        this.onUnreadCountUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  isConnected() {
    return this.websocketEnabled && this.connected;
  }

  // Request notification permission (instance method)
  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      return Notification.requestPermission();
    }
    return Promise.resolve(Notification.permission);
  }
}

export default new NotificationService();
