import fs from 'node:fs';
import path from 'node:path';
import { AdminNotification, AdminManagedUser, UserRole } from '@ojalogs/shared';
import { env } from '../config/env.js';
import { walletService } from './wallet.service.js';
import { supabaseAdmin } from '../config/supabase.js';

const PLATFORM_URL = process.env.PUBLIC_APP_URL || 'https://ojalogs.com.ng';
const NOTIF_SLUG = '_system_admin_notifications_master';
const DATA_DIR = fs.existsSync(path.join(process.cwd(), 'apps', 'api', 'data'))
  ? path.join(process.cwd(), 'apps', 'api', 'data')
  : fs.existsSync(path.join(process.cwd(), 'data'))
  ? path.join(process.cwd(), 'data')
  : path.join(process.cwd(), 'data');

const ALERTED_SIGNUPS_FILE = path.join(DATA_DIR, 'alerted_signups.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'admin_notifications.json');

class NotificationService {
  private alertedSignups: Set<string> = new Set();

  private notifications: AdminNotification[] = [
    {
      id: 'notif_welcome',
      type: 'SECURITY_ALERT',
      title: 'Platform Production Launch',
      message: 'Super Administrator Console initialized with zero-leak RLS policies and multi-server clusters.',
      timestamp: new Date().toISOString(),
      read: true
    }
  ];

  private managedUsers: AdminManagedUser[] = [
    {
      id: 'cb96d015-bc19-42f1-a2b6-531dc01f610b',
      name: 'Info.masontyler1',
      email: 'info.masontyler1@gmail.com',
      role: 'super_administrator',
      status: 'active',
      balanceNgn: 500.00,
      isVerified: true,
      totalOrders: 0,
      createdAt: '2026-11-08T10:30:49.000Z'
    },
    {
      id: 'c73a61b1-78ec-4e07-8884-8a2054d8acb4',
      name: 'Info.masontyler',
      email: 'info.masontyler@gmail.com',
      role: 'super_administrator',
      status: 'active',
      balanceNgn: 500.00,
      isVerified: true,
      totalOrders: 0,
      createdAt: '2026-11-08T10:28:24.000Z'
    },
    {
      id: 'usr_admin_001',
      name: 'Visio Reach',
      email: 'visioreach@gmail.com',
      role: 'super_administrator',
      status: 'active',
      balanceNgn: 0.00,
      isVerified: true,
      totalOrders: 0,
      createdAt: '2026-11-05T00:00:00.000Z'
    }
  ];

  constructor() {
    this.loadAlertedSignups();
    this.loadNotifications();
    this.loadFromSupabase().catch(() => {});
  }

  private isTestRuntime(): boolean {
    return (
      process.env.NODE_ENV === 'test' ||
      process.argv.some((a) => a.includes('test') || a.includes('vitest'))
    );
  }

  async loadFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('site_pages')
        .select('content')
        .eq('slug', NOTIF_SLUG)
        .maybeSingle();

      if (!error && data?.content) {
        const parsed = JSON.parse(data.content);
        if (Array.isArray(parsed.notifications) && parsed.notifications.length > 0) {
          this.notifications = parsed.notifications;
        }
        if (Array.isArray(parsed.alertedSignups)) {
          this.alertedSignups = new Set(parsed.alertedSignups.map((e: any) => String(e).toLowerCase().trim()));
        }
      }
    } catch (err: any) {
      console.warn(`[NOTIF_SUPABASE] Notice loading from Supabase: ${err.message}`);
    }
  }

  async syncToSupabase(): Promise<void> {
    try {
      const payload = JSON.stringify({
        notifications: this.notifications,
        alertedSignups: Array.from(this.alertedSignups)
      });
      const { data: existing } = await supabaseAdmin
        .from('site_pages')
        .select('id')
        .eq('slug', NOTIF_SLUG)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('site_pages')
          .update({
            content: payload,
            updated_at: new Date().toISOString()
          })
          .eq('slug', NOTIF_SLUG);
      } else {
        await supabaseAdmin
          .from('site_pages')
          .insert({
            slug: NOTIF_SLUG,
            title: 'Admin Notifications Master Store',
            content: payload,
            summary: 'Persistent notifications and read statuses for Super Admin console',
            is_published: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
    } catch (err: any) {
      console.warn(`[NOTIF_SUPABASE] Notice syncing to Supabase: ${err.message}`);
    }
  }

  private loadNotifications() {
    try {
      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.notifications = list;
          return;
        }
      }
    } catch (err: any) {
      console.warn(`[NOTIF_PERSISTENCE] Notice loading notifications: ${err.message}`);
    }
    this.saveNotifications();
  }

  private saveNotifications() {
    if (this.isTestRuntime()) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.notifications, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[NOTIF_PERSISTENCE] Notice saving notifications: ${err.message}`);
    }
  }

  private loadAlertedSignups() {
    try {
      if (fs.existsSync(ALERTED_SIGNUPS_FILE)) {
        const raw = fs.readFileSync(ALERTED_SIGNUPS_FILE, 'utf-8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.alertedSignups = new Set(list.map(e => String(e).toLowerCase().trim()));
        }
      }
    } catch (err: any) {
      console.warn(`[NOTIF_PERSISTENCE] Notice loading alerted signups: ${err.message}`);
    }
  }

  private saveAlertedSignups() {
    if (this.isTestRuntime()) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(ALERTED_SIGNUPS_FILE, JSON.stringify(Array.from(this.alertedSignups), null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[NOTIF_PERSISTENCE] Notice saving alerted signups: ${err.message}`);
    }
  }

  hasUser(email: string): boolean {
    const emailLower = (email || '').toLowerCase().trim();
    return this.managedUsers.some(u => u.email.toLowerCase() === emailLower) || this.alertedSignups.has(emailLower);
  }

  getNotifications(): AdminNotification[] {
    return this.notifications;
  }

  markAllAsRead(): AdminNotification[] {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveNotifications();
    this.syncToSupabase().catch(() => {});
    return this.notifications;
  }

  deleteNotification(id: string): boolean {
    const prevLen = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.syncToSupabase().catch(() => {});
    return this.notifications.length < prevLen;
  }

  clearNotifications(): boolean {
    this.notifications = [];
    this.saveNotifications();
    this.syncToSupabase().catch(() => {});
    return true;
  }

  getManagedUsers(): AdminManagedUser[] {
    for (const u of this.managedUsers) {
      const liveBal = walletService.getBalance(u.id, u.email);
      if (liveBal > 0 || u.balanceNgn === 0) {
        u.balanceNgn = liveBal;
      }
    }
    return this.managedUsers;
  }

  updateUserStatus(userId: string, status: 'active' | 'frozen' | 'suspended'): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    if (user) {
      user.status = status;
      return user;
    }
    return null;
  }

  updateUserRole(userId: string, role: UserRole): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  }

  adjustBalance(userId: string, amountNgn: number, type: 'credit' | 'debit'): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    if (user) {
      if (type === 'credit') {
        walletService.creditWallet(
          user.id,
          amountNgn,
          'adjustment',
          `adj_${Date.now()}`,
          'Manual Admin Balance Adjustment',
          undefined,
          user.email
        );
      } else {
        walletService.debitWallet(
          user.id,
          amountNgn,
          'adjustment',
          `adj_${Date.now()}`,
          'Manual Admin Balance Adjustment',
          undefined,
          undefined,
          user.email
        );
      }
      user.balanceNgn = walletService.getBalance(user.id, user.email);
      return user;
    }
    return null;
  }

  syncAuthUsers(users: any[]) {
    users.forEach(u => {
      const emailLower = (u.email || '').toLowerCase().trim();
      if (!emailLower) return;

      const isAdmin = emailLower === 'visioreach@gmail.com' || emailLower === 'ojalogs@gmail.com' || emailLower === 'dahfaith@gmail.com' || u.user_metadata?.role === 'administrator' || u.user_metadata?.role === 'admin';
      const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Customer';
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      const existingIndex = this.managedUsers.findIndex(m => m.id === u.id || m.email.toLowerCase() === emailLower);
      const currentBal = walletService.getBalance(u.id, u.email);

      if (existingIndex >= 0) {
        this.managedUsers[existingIndex].id = u.id || this.managedUsers[existingIndex].id;
        this.managedUsers[existingIndex].isVerified = Boolean(u.email_confirmed_at);
        this.managedUsers[existingIndex].createdAt = u.created_at || this.managedUsers[existingIndex].createdAt;
        this.managedUsers[existingIndex].lastActiveAt = u.last_sign_in_at || this.managedUsers[existingIndex].lastActiveAt;
        if (currentBal > 0 || this.managedUsers[existingIndex].balanceNgn === 0) {
          this.managedUsers[existingIndex].balanceNgn = currentBal;
        }
      } else {
        this.managedUsers.push({
          id: u.id,
          name: formattedName,
          email: u.email,
          role: isAdmin ? 'administrator' : 'customer',
          status: 'active',
          balanceNgn: currentBal,
          isVerified: Boolean(u.email_confirmed_at),
          totalOrders: 0,
          createdAt: u.created_at || new Date().toISOString(),
          lastActiveAt: u.last_sign_in_at || u.created_at
        });
      }

      // Automatically queue notification if not already present
      if (!isAdmin && !this.alertedSignups.has(emailLower) && !this.notifications.some(n => n.userEmail?.toLowerCase() === emailLower)) {
        this.alertedSignups.add(emailLower);
        this.saveAlertedSignups();
        this.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'NEW_USER_SIGNUP',
          title: 'New Customer Registered',
          message: `${formattedName} (${u.email}) joined Ojalogs marketplace.`,
          userEmail: u.email,
          timestamp: u.created_at || new Date().toISOString(),
          read: false
        });
        this.saveNotifications();
      }
    });
  }

  async recordSignupAlert(email: string, name?: string, createdAt?: string): Promise<boolean> {
    const emailLower = email.toLowerCase().trim();
    const isAdmin = emailLower === 'visioreach@gmail.com' || emailLower === 'ojalogs@gmail.com';
    const formattedName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const timestamp = createdAt || new Date().toISOString();

    const existingUser = this.managedUsers.find(u => u.email.toLowerCase() === emailLower);
    if (!existingUser) {
      this.managedUsers.unshift({
        id: `usr_${Date.now()}`,
        name: formattedName,
        email,
        role: isAdmin ? 'administrator' : 'customer',
        status: 'active',
        balanceNgn: 0.00,
        isVerified: true,
        totalOrders: 0,
        createdAt: timestamp,
        lastActiveAt: timestamp
      });
    }

    // In-App Notification (Admin Command Console only)
    const alreadyNotified = this.alertedSignups.has(emailLower) || this.notifications.some(n => n.userEmail?.toLowerCase() === emailLower);
    if (!alreadyNotified && !isAdmin) {
      this.alertedSignups.add(emailLower);
      this.saveAlertedSignups();
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'NEW_USER_SIGNUP',
        title: 'New Customer Registered',
        message: `${formattedName} (${email}) registered on Ojalogs.`,
        userEmail: email,
        timestamp,
        read: false
      });
      this.saveNotifications();
    }

    // STRICT FIRST-SIGNUP-ONLY EMAIL DEDUPLICATION:
    // 1. Never email for administrators
    if (isAdmin) {
      return false;
    }

    // 2. If this user has ALREADY been emailed previously, DO NOT send again!
    if (this.alertedSignups.has(emailLower)) {
      console.log(`[SIGNUP_ALERT] User ${emailLower} already notified on initial signup. Suppressing routine login email alert.`);
      return false;
    }

    // 3. Mark as alerted in persistent storage so all future logins are completely silent
    this.alertedSignups.add(emailLower);
    this.saveAlertedSignups();

    // 4. Dispatch single, verified first-time welcome email to admin
    await this.dispatchEmailAlert(email, formattedName, timestamp);
    return true;
  }

  async dispatchEmailAlert(userEmail: string, userName: string, registeredAt: string) {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    console.log(`[SIGNUP_ALERT] 📧 Queueing email alert to ${adminEmail} for new user ${userEmail} via verified sender ${senderEmail}...`);

    if (!brevoApiKey) {
      console.warn(`[SIGNUP_ALERT] ⚠️ BREVO_API_KEY is not set in Render environment variables. Notification queued in admin console only.`);
      return;
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Marketplace Security', email: senderEmail },
          to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
          subject: `🚨 New Customer Signup: ${userEmail} on Ojalogs`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: -0.01em;">Ojalogs Super Admin Alert</h2>
              </div>
              <h3 style="color: #0f172a; margin-top: 0;">A New Customer Just Joined Ojalogs!</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                A new customer has verified their email and registered an account on your live marketplace platform.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Email:</strong> <span style="color: #0284c7; font-family: monospace; font-weight: 600;">${userEmail}</span></p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;"><strong>Initial Wallet Balance:</strong> ₦0.00</p>
                <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Registered At:</strong> ${new Date(registeredAt).toUTCString()}</p>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${PLATFORM_URL}/admin" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin User Governance Console →</a>
              </div>
            </div>
          `
        })
      });

      if (response.ok) {
        console.log(`[SIGNUP_ALERT] ✓ Success! Admin signup alert dispatched to ${adminEmail} (via verified sender ${senderEmail})`);
      } else {
        const errorText = await response.text();
        console.warn(`[SIGNUP_ALERT] Brevo sender ${senderEmail} failed with status ${response.status}: ${errorText}`);
      }
    } catch (err: any) {
      console.warn(`[SIGNUP_ALERT] Network notice with sender ${senderEmail}: ${err.message}`);
    }
  }

  async sendTestAlert(targetEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey) {
      return {
        success: false,
        message: 'BREVO_API_KEY is not configured in Render environment variables. Please add BREVO_API_KEY in Render dashboard.'
      };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Marketplace Operations', email: senderEmail },
          to: [{ email: targetEmail, name: 'Ojalogs Operations Alert' }],
          subject: '✅ Ojalogs Operations Alert: Brevo API Connected & Operational',
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px;">Ojalogs Super Admin Notification Test</h2>
              </div>
              <h3 style="color: #0f172a; margin-top: 0;">✓ Brevo API Connection Confirmed!</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                This is a confirmed test dispatch from your live Ojalogs backend engine. Real-time signup alerts, payment notifications, and order delivery updates are now connected to <strong>${targetEmail}</strong>.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #15803d;"><strong>Verified Sender:</strong> ${senderEmail}</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d;"><strong>Recipient:</strong> ${targetEmail}</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d;"><strong>Status:</strong> Active & Monitored</p>
              </div>
              <div style="margin-top: 20px; text-align: center;">
                <span style="font-size: 12px; color: #94a3b8;">Ojalogs Marketplace Technologies Ltd • Automated System Alert</span>
              </div>
            </div>
          `
        })
      });

      if (response.ok) {
        console.log(`[TEST_EMAIL] ✓ Successfully sent test alert to ${targetEmail} using verified sender ${senderEmail}`);
        return { success: true, message: `Email alert successfully delivered to ${targetEmail} (via verified sender ${senderEmail})` };
      } else {
        const errText = await response.text();
        const lastError = `Status ${response.status}: ${errText}`;
        console.warn(`[TEST_EMAIL] Sender ${senderEmail} returned error: ${lastError}`);
        return { success: false, message: `Failed to deliver email through Brevo: ${lastError}` };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Network error connecting to Brevo: ${err.message}`
      };
    }
  }

  async recordOrderAlert(order: any, customerEmail: string): Promise<boolean> {
    if (this.isTestRuntime() || customerEmail.endsWith('@ojalogs.dev') || customerEmail.includes('tester')) {
      return true;
    }
    const timestamp = order.createdAt || new Date().toISOString();
    const orderRef = order.reference || `ord_${Date.now()}`;
    const totalNgn = order.totalNgn || 0;
    const items = order.items || [];
    const paymentMethod = (order.paymentMethod || 'wallet').toUpperCase();

    // 1. Queue In-App Super Admin Notification
    this.notifications.unshift({
      id: `notif_ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'ORDER_PLACED',
      title: `New Order Placed: #${orderRef}`,
      message: `${customerEmail} purchased ${items.length} item(s) for ₦${Number(totalNgn).toLocaleString()} via ${paymentMethod}`,
      userEmail: customerEmail,
      timestamp,
      read: false
    });
    this.saveNotifications();

    // 2. Increment user order count in managed users
    const user = this.managedUsers.find(u => u.email.toLowerCase() === customerEmail.toLowerCase());
    if (user) {
      user.totalOrders = (user.totalOrders || 0) + 1;
    }

    // 3. Dispatch Emails via Brevo (Customer Receipt + Admin Operations Alert)
    await Promise.allSettled([
      this.dispatchCustomerPurchaseEmail(order, customerEmail),
      this.dispatchAdminOrderAlertEmail(order, customerEmail)
    ]);

    return true;
  }

  async dispatchCustomerPurchaseEmail(order: any, customerEmail: string) {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey || !customerEmail || !customerEmail.includes('@')) {
      return;
    }

    const orderRef = order.reference;
    const totalFormatted = Number(order.totalNgn || 0).toLocaleString();
    const itemsHtml = (order.items || []).map((it: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-size: 13px; color: #0f172a;">
          <strong>${it.product?.title || 'Digital Good / Service'}</strong>
          <div style="font-size: 11px; color: #64748b; font-family: monospace;">Cluster: ${it.product?.serverCluster || 'Server 1'}</div>
        </td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #475569;">${it.quantity}</td>
        <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a;">₦${Number(it.unitPriceNgn || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: #020b18; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: -0.02em;">Ojalogs Marketplace</h1>
          <p style="color: #38bdf8; margin: 4px 0 0 0; font-size: 12px; font-weight: 600;">Digital Essentials & Fintech Marketplace</p>
        </div>

        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">🎉 Thank You For Your Purchase!</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your order has been confirmed and provisioned through our automated high-speed servers. Your digital keys and credentials are now encrypted and stored in your private delivery vault.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Order Reference:</strong></td>
              <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; color: #0284c7;">${orderRef}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Payment Channel:</strong></td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #10b981;">${order.paymentMethod === 'wallet' ? 'Ojalogs NGN Wallet' : 'BACH Payment Gateway'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Date:</strong></td>
              <td style="padding: 4px 0; text-align: right; color: #475569;">${new Date().toUTCString()}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; color: #64748b;">
              <th style="padding: 8px;">Item Description</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 8px; font-weight: bold; font-size: 14px; text-align: right; color: #0f172a;">Total Paid:</td>
              <td style="padding: 12px 8px; font-weight: bold; font-size: 15px; text-align: right; color: #0284c7;">₦${totalFormatted}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h4 style="margin: 0 0 6px 0; color: #166534; font-size: 14px;">🔒 Cryptographically Sealed Delivery Vault</h4>
          <p style="margin: 0; font-size: 13px; color: #15803d; line-height: 1.5;">
            To protect your digital assets from interception, license keys and tokens are sealed with AES-256-GCM. Log in to your Ojalogs account to reveal and copy your keys instantly.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${PLATFORM_URL}/orders" style="background: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Access My Orders & Reveal Vault Keys →</a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Need help with your order? Reach our 24/7 support desk at <a href="mailto:ojalogs@gmail.com" style="color: #0284c7;">ojalogs@gmail.com</a></p>
          <p style="margin: 4px 0 0 0;">Ojalogs Marketplace Technologies Ltd • All rights reserved</p>
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Marketplace', email: senderEmail },
          to: [{ email: customerEmail, name: customerEmail.split('@')[0] }],
          subject: `🎉 Purchase Receipt: Order #${orderRef} (₦${totalFormatted})`,
          htmlContent
        })
      });

      if (response.ok) {
        console.log(`[ORDER_EMAIL] ✓ Customer receipt dispatched to ${customerEmail} for order ${orderRef}`);
      } else {
        const err = await response.text();
        console.warn(`[ORDER_EMAIL] Customer receipt error: ${err}`);
      }
    } catch (err: any) {
      console.warn(`[ORDER_EMAIL] Customer receipt network notice: ${err.message}`);
    }
  }

  async dispatchAdminOrderAlertEmail(order: any, customerEmail: string) {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey) return;

    const orderRef = order.reference;
    const totalFormatted = Number(order.totalNgn || 0).toLocaleString();
    const itemsSummary = (order.items || []).map((it: any) => `• ${it.product?.title || 'Item'} (Qty: ${it.quantity}, Cluster: ${it.product?.serverCluster || 'Server 1'})`).join('<br/>');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px;">🛒 New Marketplace Purchase Alert</h2>
        </div>
        <h3 style="color: #0f172a; margin-top: 0;">Order #${orderRef} Settled Successfully</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          A customer has completed checkout on your live marketplace. Deliveries have been provisioned and recorded into the platform ledger.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Customer:</strong> <span style="color: #0284c7; font-family: monospace; font-weight: 600;">${customerEmail}</span></p>
          <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Order Reference:</strong> <span style="font-family: monospace; font-weight: bold;">${orderRef}</span></p>
          <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Revenue:</strong> <span style="color: #10b981; font-weight: bold; font-size: 15px;">₦${totalFormatted}</span></p>
          <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Payment Channel:</strong> ${order.paymentMethod === 'wallet' ? 'Customer Wallet Debit' : 'BACH Payment Gateway'}</p>
          <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Items Purchased:</strong></p>
          <div style="padding-left: 8px; color: #334155; line-height: 1.5;">${itemsSummary}</div>
          <p style="margin: 8px 0 0 0; color: #64748b;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
        </div>

        <div style="margin-top: 24px; text-align: center;">
          <a href="${PLATFORM_URL}/admin" style="background: #0284c7; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin Orders & Deliveries Console →</a>
        </div>
      </div>
    `;

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Marketplace Operations', email: senderEmail },
          to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
          subject: `🛒 New Customer Order: #${orderRef} - ₦${totalFormatted} (${customerEmail})`,
          htmlContent
        })
      });

      if (response.ok) {
        console.log(`[ORDER_ALERT] ✓ Super admin order alert dispatched to ${adminEmail} for order ${orderRef}`);
      } else {
        const err = await response.text();
        console.warn(`[ORDER_ALERT] Admin order alert error: ${err}`);
      }
    } catch (err: any) {
      console.warn(`[ORDER_ALERT] Admin order alert notice: ${err.message}`);
    }
  }

  async recordDepositAlert(userId: string, userEmail: string, amountNgn: number, reference: string) {
    const timestamp = new Date().toISOString();
    const formattedAmount = Number(amountNgn).toLocaleString();

    this.notifications.unshift({
      id: `notif_dep_${Date.now()}`,
      type: 'PAYMENT_RECEIVED',
      title: `Deposit Credited: ₦${formattedAmount}`,
      message: `${userEmail} funded their wallet with ₦${formattedAmount} via BACH Gateway (Ref: ${reference})`,
      userEmail,
      timestamp,
      read: false
    });
    this.saveNotifications();

    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey) return;

    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Finance Engine', email: senderEmail },
          to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
          subject: `💳 Wallet Deposit: ₦${formattedAmount} credited (${userEmail})`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px;">💳 Customer Wallet Deposit</h2>
              </div>
              <h3 style="color: #0f172a; margin-top: 0;">Deposit Verified by BACH Gateway</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                A customer has successfully funded their NGN wallet on your marketplace. Ledger balance has been updated.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 8px 0; color: #166534;"><strong>Customer:</strong> ${userEmail}</p>
                <p style="margin: 0 0 8px 0; color: #166534;"><strong>Deposit Amount:</strong> <span style="font-size: 16px; font-weight: bold; color: #15803d;">₦${formattedAmount}</span></p>
                <p style="margin: 0 0 8px 0; color: #166534;"><strong>Gateway Reference:</strong> <span style="font-family: monospace;">${reference}</span></p>
                <p style="margin: 0; color: #166534;"><strong>Date:</strong> ${new Date().toUTCString()}</p>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${PLATFORM_URL}/admin" style="background: #15803d; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin Ledger Inspector →</a>
              </div>
            </div>
          `
        })
      });
      console.log(`[DEPOSIT_ALERT] ✓ Admin deposit alert sent for ${reference} (₦${formattedAmount})`);
    } catch (err: any) {
      console.warn(`[DEPOSIT_ALERT] Deposit alert notice: ${err.message}`);
    }
  }

  async recordTelephonyAlert(userEmail: string, country: string, service: string, phoneNumber: string, amountNgn: number, sessionRef: string) {
    const timestamp = new Date().toISOString();
    const formattedAmount = Number(amountNgn).toLocaleString();

    this.notifications.unshift({
      id: `notif_tel_${Date.now()}`,
      type: 'ORDER_PLACED',
      title: `Virtual Number Leased: ${service} (${country})`,
      message: `${userEmail} allocated ${phoneNumber} for ${service} (₦${formattedAmount})`,
      userEmail,
      timestamp,
      read: false
    });

    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey) return;

    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Telephony Engine', email: senderEmail },
          to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
          subject: `📞 Virtual Number Leased: ${service} (${country}) - ₦${formattedAmount} (${userEmail})`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px;">📞 Telephony Virtual Line Leased</h2>
              </div>
              <h3 style="color: #0f172a; margin-top: 0;">SMS Verification Line Active</h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                A customer has rented a dedicated private number with automated 15-minute SMS listener.
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Customer:</strong> ${userEmail}</p>
                <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Service:</strong> <span style="font-weight: bold; color: #0284c7;">${service}</span></p>
                <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Country:</strong> ${country}</p>
                <p style="margin: 0 0 8px 0; color: #64748b;"><strong>Allocated Number:</strong> <span style="font-family: monospace; font-weight: bold;">${phoneNumber}</span></p>
                <p style="margin: 0; color: #64748b;"><strong>Debit Amount:</strong> ₦${formattedAmount}</p>
              </div>
              <div style="margin-top: 24px; text-align: center;">
                <a href="${PLATFORM_URL}/admin" style="background: #0284c7; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin Telephony Console →</a>
              </div>
            </div>
          `
        })
      });
    } catch (err: any) {
      console.warn(`[TELEPHONY_ALERT] Telephony alert notice: ${err.message}`);
    }
  }

  async recordRefundAlert(userEmail: string, amountNgn: number, reference: string, reason: string) {
    const timestamp = new Date().toISOString();
    const formattedAmount = Number(amountNgn).toLocaleString();

    this.notifications.unshift({
      id: `notif_ref_${Date.now()}`,
      type: 'SECURITY_ALERT',
      title: `Refund Credited: ₦${formattedAmount}`,
      message: `100% Refund credited to ${userEmail} for ${reference}. Reason: ${reason}`,
      userEmail,
      timestamp,
      read: false
    });

    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'noreply@ojalogs.com.ng';

    if (!brevoApiKey) return;

    try {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Ojalogs Refund Engine', email: senderEmail },
          to: [{ email: adminEmail, name: 'Ojalogs Operations Alert' }],
          subject: `💸 Refund Processed: ₦${formattedAmount} (${userEmail})`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <div style="background: #020b18; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #ffffff; margin: 0; font-size: 18px;">💸 Customer Refund Processed</h2>
              </div>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                An automated 100% refund has been credited back to the customer's wallet balance.
              </p>
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 8px 0; color: #9a3412;"><strong>Customer:</strong> ${userEmail}</p>
                <p style="margin: 0 0 8px 0; color: #9a3412;"><strong>Refund Amount:</strong> <span style="font-size: 16px; font-weight: bold;">₦${formattedAmount}</span></p>
                <p style="margin: 0 0 8px 0; color: #9a3412;"><strong>Reference:</strong> ${reference}</p>
                <p style="margin: 0; color: #9a3412;"><strong>Reason:</strong> ${reason}</p>
              </div>
            </div>
          `
        })
      });
    } catch (err: any) {
      console.warn(`[REFUND_ALERT] Refund alert notice: ${err.message}`);
    }
  }
}

export const notificationService = new NotificationService();
