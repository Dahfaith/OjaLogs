import fs from 'node:fs';
import path from 'node:path';

export interface AdminAuditEntry {
  id: string;
  action: 'MARKUP_CHANGED' | 'WALLET_ADJUSTMENT' | 'API_CONFIG_UPDATED' | 'CONNECTIVITY_TESTED' | 'MANUAL_DISPATCH' | 'ORDER_REFUND' | 'SYSTEM_EVENT';
  category: 'pricing' | 'wallets' | 'apis' | 'orders' | 'security';
  actorEmail: string;
  target: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : path.join(process.cwd(), 'data');

const AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_log.json');

const INITIAL_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: 'audit_init_001',
    action: 'SYSTEM_EVENT',
    category: 'security',
    actorEmail: 'system@ojalogs.com.ng',
    target: 'Platform Core',
    details: 'Admin Dashboard initialized with enterprise role-based security & immutable ledger audit.',
    timestamp: '2026-11-20T10:00:00.000Z'
  },
  {
    id: 'audit_init_002',
    action: 'MARKUP_CHANGED',
    category: 'pricing',
    actorEmail: 'ojalogs@gmail.com',
    target: 'Server 2 API (Social Accounts)',
    details: 'Configured global profit markup to 20% on upstream fleet prices.',
    timestamp: '2026-11-20T11:15:00.000Z',
    metadata: { previousMarkup: 0, newMarkup: 20 }
  },
  {
    id: 'audit_init_003',
    action: 'API_CONFIG_UPDATED',
    category: 'apis',
    actorEmail: 'ojalogs@gmail.com',
    target: 'TextPlug Telephony Hub',
    details: 'Updated virtual telephony webhook & active poll configuration.',
    timestamp: '2026-11-20T12:00:00.000Z'
  }
];

export class AuditService {
  private logs: AdminAuditEntry[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    this.logs = [...INITIAL_AUDIT_LOGS];
    this.loadPersisted();
  }

  private loadPersisted(): void {
    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(this.logs.map(l => l.id));
          for (const item of parsed) {
            if (!ids.has(item.id)) {
              this.logs.push(item);
              ids.add(item.id);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[AUDIT_SERVICE] Load notice: ${err.message}`);
    }
  }

  private savePersisted(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.logs.slice(-500), null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[AUDIT_SERVICE] Save notice: ${err.message}`);
    }
  }

  recordEvent(event: Omit<AdminAuditEntry, 'id' | 'timestamp'>): AdminAuditEntry {
    const entry: AdminAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    this.logs.unshift(entry);
    this.savePersisted();
    console.log(`[AUDIT_LOG] [${entry.action}] by ${entry.actorEmail}: ${entry.details}`);
    return entry;
  }

  getEvents(limit = 100): AdminAuditEntry[] {
    return this.logs.slice(0, Math.min(500, limit));
  }
}

export const auditService = new AuditService();
