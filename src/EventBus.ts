// EventBus.ts - Simple event bus system for pub/sub pattern

export interface IEventBus {
    subscribe(event: string, callback: (data?: any) => void): () => void;
    publish(event: string, data?: any): void;
    unsubscribe(event: string, callback: (data?: any) => void): void;
    clear(): void;
}

export class EventBus implements IEventBus {
    private events: Map<string, Set<(data?: any) => void>> = new Map();

    subscribe(event: string, callback: (data?: any) => void): () => void {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }

        const callbacks = this.events.get(event)!;
        callbacks.add(callback);

        // Return unsubscribe function
        return () => {
            this.unsubscribe(event, callback);
        };
    }

    publish(event: string, data?: any): void {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }
    }

    unsubscribe(event: string, callback: (data?: any) => void): void {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    clear(): void {
        this.events.clear();
    }
}