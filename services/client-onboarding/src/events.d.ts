export declare function emitEvent(type: string, payload?: Record<string, any>): Promise<void>;
// Re-export so either import path works during transition
export * from './eventEmitter';
