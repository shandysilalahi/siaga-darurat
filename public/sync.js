/**
 * RealTimeSync - Shared real-time synchronization layer for Siaga Darurat.
 * Uses BroadcastChannel for instant cross-tab communication and falls back
 * to localStorage storage events for maximum browser compatibility (e.g. file:// protocol).
 */
class RealTimeSync {
  constructor(channelName = 'siaga_darurat_tracking') {
    this.channelName = channelName;
    this.listeners = {};
    this.useLocalStorageFallback = true;

    // 1. Initialize BroadcastChannel if available
    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          this._handleMessage(event.data);
        };
        this.useLocalStorageFallback = false;
        console.log('RealTimeSync: BroadcastChannel initialized successfully.');
      }
    } catch (e) {
      console.warn('RealTimeSync: BroadcastChannel failed or unsupported, using localStorage fallback.', e);
      this.useLocalStorageFallback = true;
    }

    // 2. Setup localStorage storage event fallback
    window.addEventListener('storage', (event) => {
      // Listen to a specific key
      if (event.key === `sync_${this.channelName}` && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          // Only handle messages sent by other tabs
          if (payload.senderTabId !== this._getTabId()) {
            this._handleMessage(payload.data);
          }
        } catch (e) {
          console.error('RealTimeSync: Failed to parse localStorage sync payload.', e);
        }
      }
    });

    // Generate a unique tab ID to prevent processing own messages in localStorage fallback
    this.tabId = Math.random().toString(36).substring(2, 11);
  }

  /**
   * Register a listener for a specific message type.
   */
  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  /**
   * Send a message to other tabs.
   */
  send(type, payload = {}) {
    const message = { type, payload };
    
    // Send via BroadcastChannel if active
    if (this.channel) {
      this.channel.postMessage(message);
    }
    
    // Always write to localStorage as double insurance/fallback
    try {
      const storageKey = `sync_${this.channelName}`;
      const envelope = {
        senderTabId: this._getTabId(),
        data: message,
        timestamp: Date.now() // forces storage event to fire even if content is identical
      };
      localStorage.setItem(storageKey, JSON.stringify(envelope));
    } catch (e) {
      console.error('RealTimeSync: Failed to write to localStorage for sync.', e);
    }
  }

  /**
   * Internal message handler.
   */
  _handleMessage(message) {
    if (message && message.type) {
      const type = message.type;
      const payload = message.payload || {};
      
      console.log(`RealTimeSync: Received event "${type}"`, payload);
      
      if (this.listeners[type]) {
        this.listeners[type].forEach(callback => {
          try {
            callback(payload);
          } catch (err) {
            console.error(`Error in listener for event "${type}":`, err);
          }
        });
      }
    }
  }

  _getTabId() {
    return this.tabId;
  }

  /**
   * Clean up resources.
   */
  close() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

// Export class to global window scope
window.RealTimeSync = RealTimeSync;
