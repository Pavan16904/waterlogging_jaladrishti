import mqtt, { MqttClient } from 'mqtt';
import { query } from '../../db/index.js';

export interface DeviceHealth {
  device_id: string;
  last_ts: string;
  is_stale: boolean;
  is_stuck: boolean;
  reading_count: number;
  last_value: number;
}

export class MqttSensorService {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private lastMessageAt: Date | null = null;
  private lastError: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const mqttUrl = process.env.MQTT_URL;
    if (!mqttUrl) {
      return;
    }

    try {
      console.log(`[*] Connecting to MQTT broker at ${mqttUrl}...`);
      this.client = mqtt.connect(mqttUrl, {
        username: process.env.MQTT_USERNAME || undefined,
        password: process.env.MQTT_PASSWORD || undefined,
        connectTimeout: 5000,
        reconnectPeriod: 10000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.lastError = null;
        console.log('[+] Connected to IoT MQTT Broker. Subscribing to sensor telemetry channels...');
        this.client?.subscribe(['jaladrishti/sensors/+', 'karnataka/sensors/+'], (err) => {
          if (err) console.error('[-] MQTT subscription error:', err.message);
        });
      });

      this.client.on('message', async (topic, payload) => {
        try {
          const raw = payload.toString();
          const parsed = JSON.parse(raw);
          await this.recordReading(parsed);
          this.lastMessageAt = new Date();
        } catch (err: any) {
          console.warn('[!] Error handling MQTT message payload:', err.message);
        }
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        this.lastError = err.message;
      });

      this.client.on('close', () => {
        this.isConnected = false;
      });
    } catch (err: any) {
      this.isConnected = false;
      this.lastError = err.message;
    }
  }

  /**
   * Stores incoming sensor reading into sensor_readings
   */
  public async recordReading(data: {
    device_id: string;
    ts?: string;
    value: number;
    battery?: number;
    lat: number;
    lon: number;
  }): Promise<void> {
    const ts = data.ts ? new Date(data.ts).toISOString() : new Date().toISOString();
    await query(
      `INSERT INTO sensor_readings (device_id, ts, value, battery, lat, lon)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        data.device_id,
        ts,
        data.value,
        data.battery ?? null,
        data.lat,
        data.lon,
      ]
    );
  }

  /**
   * Evaluates device health across all telemetry devices:
   * 1. Flag stale devices: no message received in the last 15 minutes.
   * 2. Flag stuck values: identical readings for the last 6 consecutive reports.
   */
  public async evaluateDeviceHealth(): Promise<DeviceHealth[]> {
    try {
      // Find all distinct devices
      const devicesRes = await query('SELECT DISTINCT device_id FROM sensor_readings');
      const results: DeviceHealth[] = [];
      const now = Date.now();
      const fifteenMinMs = 15 * 60 * 1000;

      for (const row of devicesRes.rows) {
        const deviceId = row.device_id;
        // Fetch last 6 readings for this device ordered by ts desc
        const readingsRes = await query(
          'SELECT ts, value FROM sensor_readings WHERE device_id = $1 ORDER BY ts DESC LIMIT 6',
          [deviceId]
        );

        if (readingsRes.rows.length === 0) continue;

        const latestReading = readingsRes.rows[0];
        const latestTime = new Date(latestReading.ts).getTime();
        const isStale = (now - latestTime) > fifteenMinMs;

        // Stuck check: exactly 6 readings and all 6 have identical value
        const isStuck = readingsRes.rows.length >= 6 &&
          readingsRes.rows.every((r) => Math.abs(r.value - latestReading.value) < 0.0001);

        results.push({
          device_id: deviceId,
          last_ts: latestReading.ts,
          is_stale: isStale,
          is_stuck: isStuck,
          reading_count: readingsRes.rows.length,
          last_value: latestReading.value,
        });
      }

      return results;
    } catch (err: any) {
      console.error('[-] Error evaluating sensor device health:', err.message);
      return [];
    }
  }

  public async getStatus() {
    const hasUrl = Boolean(process.env.MQTT_URL);
    let rowCount = 0;
    try {
      const res = await query('SELECT COUNT(*) as count FROM sensor_readings');
      rowCount = parseInt(res.rows[0]?.count || '0', 10);
    } catch {}

    if (!hasUrl) {
      return {
        source: 'mqtt_iot_sensors',
        name: 'In-Situ IoT Ultrasonic & Level Sensor Stream',
        status: 'unconfigured' as const,
        fetched_at: null,
        age_seconds: null,
        row_count: rowCount,
        reason: 'MQTT_URL not configured. Requires MQTT IoT broker endpoint (e.g., mqtt://broker.hivemq.com:1883 or AWS IoT Core).',
      };
    }

    const healthList = await this.evaluateDeviceHealth();
    const staleCount = healthList.filter((d) => d.is_stale).length;
    const stuckCount = healthList.filter((d) => d.is_stuck).length;

    const now = Date.now();
    const ageSeconds = this.lastMessageAt ? Math.round((now - this.lastMessageAt.getTime()) / 1000) : null;

    let reason = `IoT subscriber active (${healthList.length} devices online`;
    if (staleCount > 0) reason += `, ${staleCount} stale >15 min`;
    if (stuckCount > 0) reason += `, ${stuckCount} stuck identical values (6 readings)`;
    reason += ')';

    return {
      source: 'mqtt_iot_sensors',
      name: 'In-Situ IoT Ultrasonic & Level Sensor Stream',
      status: this.isConnected ? ('live' as const) : ('error' as const),
      fetched_at: this.lastMessageAt ? this.lastMessageAt.toISOString() : null,
      age_seconds: ageSeconds,
      row_count: rowCount,
      reason: this.lastError || reason,
    };
  }
}

export const mqttSensorService = new MqttSensorService();
