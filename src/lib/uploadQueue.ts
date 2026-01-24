/**
 * Upload queue management for batch video uploads
 */

export interface QueueItem {
  id: string;
  file: File;
  title: string;
  category: string;
  status: 'pending' | 'compressing' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
  thumbnailUrl?: string;
}

export type QueueUpdateCallback = (queue: QueueItem[]) => void;

class UploadQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private listeners: Set<QueueUpdateCallback> = new Set();
  private processCallback: ((item: QueueItem) => Promise<void>) | null = null;

  subscribe(callback: QueueUpdateCallback) {
    this.listeners.add(callback);
    callback([...this.queue]);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.queue]));
  }

  setProcessor(callback: (item: QueueItem) => Promise<void>) {
    this.processCallback = callback;
  }

  addFiles(files: File[], category: string) {
    const newItems: QueueItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      category,
      status: 'pending' as const,
      progress: 0,
    }));

    this.queue.push(...newItems);
    this.notify();
    
    if (!this.isProcessing) {
      this.processNext();
    }

    return newItems;
  }

  updateItem(id: string, updates: Partial<QueueItem>) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue[index] = { ...this.queue[index], ...updates };
      this.notify();
    }
  }

  removeItem(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.notify();
  }

  retryItem(id: string) {
    const item = this.queue.find(i => i.id === id);
    if (item && item.status === 'error') {
      item.status = 'pending';
      item.progress = 0;
      item.error = undefined;
      this.notify();
      
      if (!this.isProcessing) {
        this.processNext();
      }
    }
  }

  clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'complete');
    this.notify();
  }

  getQueue() {
    return [...this.queue];
  }

  private async processNext() {
    const pendingItem = this.queue.find(item => item.status === 'pending');
    
    if (!pendingItem || !this.processCallback) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    try {
      await this.processCallback(pendingItem);
    } catch (error) {
      this.updateItem(pendingItem.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }

    // Process next item
    this.processNext();
  }
}

export const uploadQueue = new UploadQueue();
