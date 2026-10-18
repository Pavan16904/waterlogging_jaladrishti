import { Redis } from 'ioredis';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private errorReason: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.errorReason = 'REDIS_URL environment variable is not configured';
      return;
    }

    try {
      this.connectionAttempted = true;
      // Connect with short retry limit to avoid hanging if Redis is offline
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.errorReason = 'Redis max connection retries reached';
            return null; // Stop reconnecting
          }
          return Math.min(times * 500, 2000);
        },
        connectTimeout: 2000,
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.errorReason = null;
        console.log('[+] Redis cache connected successfully');
      }).catch((err: any) => {
        this.isConnected = false;
        this.errorReason = `Connection failed: ${err.message}`;
        console.warn(`[!] Redis connection unsuccessful (${err.message}). Using local in-memory cache.`);
      });

      this.client.on('error', (err: any) => {
        this.isConnected = false;
        this.errorReason = err.message;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      this.isConnected = false;
      this.errorReason = err.message;
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  public getStatus(): { status: 'live' | 'unconfigured' | 'error'; reason: string } {
    if (!process.env.REDIS_URL) {
      return { status: 'unconfigured', reason: 'REDIS_URL not configured in environment' };
    }
    if (this.isConnected) {
      return { status: 'live', reason: 'Redis cluster/server operational' };
    }
    return { status: 'error', reason: this.errorReason || 'Redis offline, falling back to local memory cache' };
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) return null;
    try {
      const val = await this.client!.get(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }

  public async set(key: string, val: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      const str = JSON.stringify(val);
      await this.client!.set(key, str, 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn(`[Redis] Failed to set key "${key}":`, err.message);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await this.client!.del(key);
    } catch {
      // Ignore cache eviction errors
    }
  }
}

export const redisService = new RedisService();
