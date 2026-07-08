// mobile/utils/eventEmitter.ts
type EventCallback = (data?: any) => void;

class EventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    console.log(`📢 EventEmitter: Added listener for "${event}", total: ${this.events[event].length}`);
  }

  off(event: string, callback: EventCallback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    console.log(`📢 EventEmitter: Removed listener for "${event}", remaining: ${this.events[event].length}`);
  }

  emit(event: string, data?: any) {
    if (!this.events[event]) {
      console.log(`📢 EventEmitter: No listeners for "${event}"`);
      return;
    }
    console.log(`📢 EventEmitter: Emitting "${event}" to ${this.events[event].length} listeners`);
    this.events[event].forEach((callback, index) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`📢 EventEmitter: Error in listener ${index} for "${event}":`, error);
      }
    });
  }
}

export default new EventEmitter();