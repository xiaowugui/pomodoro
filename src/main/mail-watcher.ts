export interface MailWatcherConfig {
  enabled?: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  pollInterval: number;
}

export class MailWatcher {
  private isRunning: boolean = false;

  async start(config: MailWatcherConfig): Promise<void> {
    if (!config.enabled) {
      return;
    }
    this.isRunning = true;
  }

  async stop(): Promise<void> {
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
