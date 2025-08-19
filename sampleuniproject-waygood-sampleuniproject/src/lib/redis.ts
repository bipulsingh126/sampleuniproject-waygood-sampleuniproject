import { createClient, RedisClientType } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;
// Function to connect to Redis
  async connect() {
    if (this.isConnected && this.client) {
      return this.client;
    }

    try {
      this.client = createClient({
        url: REDIS_URL,
        socket: {
          reconnectStrategy: (retries: number) => Math.min(retries * 50, 1000)
        }
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.client = null;
      this.isConnected = false;
      throw error;
    }
  }

// Function to get value from Redis
  async get(key: string): Promise<string | null> {
    try {
      const client = await this.connect();
      return await client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

// Function to set value in Redis
  async set(key: string, value: string, expireInSeconds?: number): Promise<boolean> {
    try {
      const client = await this.connect();
      if (expireInSeconds) {
        await client.setEx(key, expireInSeconds, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

// Function to delete value from Redis
  async del(key: string): Promise<boolean> {
    try {
      const client = await this.connect();
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

// Function to check if key exists in Redis
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.connect();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

// Function to flush keys matching pattern
  async flushPattern(pattern: string): Promise<boolean> {
    try {
      const client = await this.connect();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis FLUSH PATTERN error:', error);
      return false;
    }
  }

// Function to disconnect from Redis
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default new RedisService();
