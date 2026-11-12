import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';
import { encryptPayload, decryptPayload } from '../utils/crypto.js';
import { env } from '../config/env.js';
import { telephonyRegistry } from '../adapters/telephony/telephony.registry.js';
import { smmService } from './smm.service.js';
import { linkocialAdapter } from '../adapters/smm/linkocial.adapter.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';
import { bachGateway } from '../gateways/bach.gateway.js';

const CONFIG_SLUG = 'sys_upstream_config';

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : fs.existsSync(path.join(process.cwd(), 'data'))
  ? path.join(process.cwd(), 'data')
  : path.join(process.cwd(), 'data');

export interface EncryptedSystemConfig {
  telephony: any[];
  smm: any;
  servers: any[];
  gateways?: any[];
  updatedAt: string;
}

export class ConfigService {
  private isInitialized = false;

  /**
   * Initializes the configuration from Supabase persistent database.
   * If found, decrypts and applies credentials across all registries.
   * If not found, seeds Supabase with the active production credentials.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[CONFIG_SERVICE] Loading encrypted upstream configuration from Supabase...');
      const { data, error } = await supabaseAdmin
        .from('site_pages')
        .select('*')
        .eq('slug', CONFIG_SLUG)
        .maybeSingle();

      if (error) {
        console.warn(`[CONFIG_SERVICE] Supabase load notice: ${error.message}`);
      }

      if (data && data.content) {
        let parsed: EncryptedSystemConfig | null = null;
        try {
          // Check if payload is encrypted (contains colon delimiters) or plaintext JSON
          if (data.content.includes(':') && !data.content.trim().startsWith('{')) {
            const decryptedJson = decryptPayload(data.content);
            parsed = JSON.parse(decryptedJson);
          } else {
            parsed = JSON.parse(data.content);
          }
        } catch (decryptErr: any) {
          console.warn(`[CONFIG_SERVICE] Decrypt notice: ${decryptErr.message}`);
        }

        if (parsed) {
          this.applyConfig(parsed);
          this.isInitialized = true;
          console.log('[CONFIG_SERVICE] ✓ Successfully restored upstream configurations from Supabase.');
          return;
        }
      }

      // If no config found in Supabase or failed to parse, seed default authentic configuration
      console.log('[CONFIG_SERVICE] No saved Supabase configuration found. Seeding authentic credentials...');
      await this.syncToSupabase();
      this.isInitialized = true;
    } catch (err: any) {
      console.warn(`[CONFIG_SERVICE] Initialization notice: ${err.message}`);
      this.isInitialized = true;
    }
  }

  /**
   * Applies the loaded configuration to all in-memory registries, adapters, and local files.
   */
  private applyConfig(config: EncryptedSystemConfig) {
    // 1. Apply Telephony configuration (TextPlug)
    if (Array.isArray(config.telephony)) {
      for (const item of config.telephony) {
        if (item?.id) {
          try {
            telephonyRegistry.update(item.id, item);
          } catch {
            // If not found in registry map yet
          }
        }
      }
    }

    // 2. Apply SMM configuration (Linkocial)
    if (config.smm && config.smm.apiKey) {
      smmService.updateProviderConfig(config.smm).catch(() => {});
      linkocialAdapter.setCredentials(config.smm.apiKey, config.smm.apiUrl);
    }

    // 3. Apply Server configurations (Server 2 & 4: LogsPoll)
    if (Array.isArray(config.servers)) {
      for (const item of config.servers) {
        if (item?.cluster) {
          try {
            serverApiRegistry.updateConfig(item.cluster, item);
          } catch {}
        }
      }
      const srv2 = config.servers.find((s: any) => s.cluster === 'Server 2' || s.id === 'server-2');
      if (srv2?.apiKey) {
        logspollAdapter.setCredentials(srv2.apiKey, srv2.apiUrl);
      }
    }

    // 4. Apply Gateways (Bachs)
    if (Array.isArray(config.gateways)) {
      const bach = config.gateways.find((g: any) => g.id === 'bach');
      if (bach && bach.secretKey) {
        bachGateway.updateCredentials({
          apiKey: bach.secretKey,
          webhookSecret: bach.webhookSecret,
          baseUrl: bach.baseUrl
        });
      }
    }
  }

  /**
   * Encrypts and syncs current registry configs into Supabase persistent storage.
   */
  async syncToSupabase(): Promise<void> {
    try {
      const telephony = telephonyRegistry.getAll();
      const smm = await smmService.getProviderConfig();
      const servers = serverApiRegistry.getAllConfigs();

      // Ensure TextPlug has authentic key if blank
      const tp = telephony.find((t: any) => t.id === 'provider-textplug');
      if (tp && (!tp.apiKey || tp.apiKey.trim().length === 0)) {
        tp.apiKey = process.env.TEXTPLUG_API_KEY || 'tp_8c6e8ab0a682c44c3148c3a7055007c658717577f88ebb67bbc486b6dc00b75e';
      }

      // Ensure LogsPoll has authentic key if blank
      const srv2 = servers.find((s: any) => s.id === 'server-2');
      if (srv2 && (!srv2.apiKey || srv2.apiKey.trim().length === 0)) {
        srv2.apiKey = process.env.LOGSPOLL_API_KEY || 'lp_live_37f040ba58a25c1178bf850aba5d9b49a11cf47b3e911c6b';
      }
      const srv4 = servers.find((s: any) => s.id === 'server-4');
      if (srv4 && (!srv4.apiKey || srv4.apiKey.trim().length === 0)) {
        srv4.apiKey = process.env.LOGSPOLL_API_KEY || 'lp_live_37f040ba58a25c1178bf850aba5d9b49a11cf47b3e911c6b';
      }

      // Ensure Linkocial has authentic key if blank
      if (smm && (!smm.apiKey || smm.apiKey === 'linkocial_live_token_default' || smm.apiKey.trim().length === 0)) {
        smm.apiKey = process.env.LINKOCIAL_API_KEY || '8pydsuH2oVPiQ2Lqq0rkA9cmczHbTZKjjXnWLhXD';
      }

      const bachGatewayConfig = {
        id: 'bach',
        name: 'BACH Payment Gateway',
        secretKey: process.env.BACHS_API_KEY || 'sk_live_8023c25e_M1f-1Y5wca1v69aGbZGKTiunGDo4_MEl4e-34g5CDmE',
        webhookSecret: process.env.BACHS_WEBHOOK_SECRET || 'whsec_bb7ceb24462c1308b90bfba04c1d624c9c4d87165247540c043a4d246df5c716',
        baseUrl: process.env.BACHS_BASE_URL || 'https://api.bachs.io/v1',
        isActive: true
      };

      const payload: EncryptedSystemConfig = {
        telephony,
        smm,
        servers,
        gateways: [bachGatewayConfig],
        updatedAt: new Date().toISOString()
      };

      const jsonString = JSON.stringify(payload);
      const encryptedContent = encryptPayload(jsonString);

      const { error } = await supabaseAdmin
        .from('site_pages')
        .upsert({
          slug: CONFIG_SLUG,
          title: 'System Upstream Encrypted Config',
          category: 'internal',
          summary: 'Encrypted master store for upstream API keys (TextPlug, LogsPoll, Linkocial, Bachs)',
          content: encryptedContent,
          last_updated_at: new Date().toISOString()
        }, { onConflict: 'slug' });

      if (error) {
        console.warn(`[CONFIG_SERVICE] Supabase sync warning: ${error.message}`);
      } else {
        console.log('[CONFIG_SERVICE] ✓ Successfully synced AES-256 encrypted upstream configs to Supabase.');
      }

      // Also ensure local data files exist as cache
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DATA_DIR, 'telephony_config.json'), JSON.stringify(telephony, null, 2), 'utf-8');
        fs.writeFileSync(path.join(DATA_DIR, 'smm_config.json'), JSON.stringify(smm, null, 2), 'utf-8');
        fs.writeFileSync(path.join(DATA_DIR, 'server_configs.json'), JSON.stringify(servers, null, 2), 'utf-8');
      } catch (fErr: any) {
        console.warn(`[CONFIG_SERVICE] Local cache write notice: ${fErr.message}`);
      }
    } catch (err: any) {
      console.warn(`[CONFIG_SERVICE] Sync error: ${err.message}`);
    }
  }
}

export const configService = new ConfigService();
