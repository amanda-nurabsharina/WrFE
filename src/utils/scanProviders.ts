export interface ScanProvider {
  start(onScan: (barcode: string) => void): void;
  stop(): void;
}

export class KeyboardScanProvider implements ScanProvider {
  private gapMs: number;
  private onScanCallback?: (barcode: string) => void;
  private buffer: string = '';
  private lastKeyTime: number = 0;

  constructor(gapMs: number) {
    this.gapMs = gapMs;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  public start(onScan: (barcode: string) => void): void {
    this.onScanCallback = onScan;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.buffer = '';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore inputs in standard editable elements to prevent scanning logic from intercepting standard typing
    const activeEl = document.activeElement;
    if (activeEl && (
      activeEl.tagName === 'INPUT' || 
      activeEl.tagName === 'TEXTAREA' || 
      (activeEl as HTMLElement).isContentEditable
    )) {
      // Exception: Only allow scan interception in inputs specifically marked with data-barcode-input
      if (!activeEl.hasAttribute('data-barcode-input')) {
        return;
      }
    }

    // Ignore modifier keys
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    // Ignore navigation/function keys
    if (e.key.length > 1 && e.key !== 'Enter') return;

    const currentTime = Date.now();

    // If time gap is too large, reset buffer (only if it's not the first character)
    if (this.buffer.length > 0 && currentTime - this.lastKeyTime > this.gapMs) {
      this.buffer = '';
    }

    this.lastKeyTime = currentTime;

    if (e.key === 'Enter') {
      if (this.buffer.length > 0) {
        if (this.onScanCallback) {
          this.onScanCallback(this.buffer);
        }
        this.buffer = '';
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      this.buffer += e.key;
    }
  }
}
