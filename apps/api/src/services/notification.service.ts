import { AdminNotification, AdminManagedUser, UserRole } from '@ojalogs/shared';
import { env } from '../config/env.js';
import { walletService } from './wallet.service.js';

class NotificationService {
  private notifications: AdminNotification[] = [
    {
      id: 'notif_welcome',
      type: 'SECURITY_ALERT',
      title: 'Platform Production Launch',
      message: 'Super Administrator Console initialized with zero-leak RLS policies and multi-server clusters.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ];

  private managedUsers: AdminManagedUser[] = [
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

  getNotifications(): AdminNotification[] {
    return this.notifications;
  }

  markAllAsRead(): AdminNotification[] {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    return this.notifications;
  }

  getManagedUsers(): AdminManagedUser[] {
    return this.managedUsers;
  }

  updateUserStatus(userId: string, status: 'active' | 'frozen' | 'suspended'): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId);
    if (user) {
      user.status = status;
      return user;
    }
    return null;
  }

  updateUserRole(userId: string, role: UserRole): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId);
    if (user) {
      user.role = role;
      return user;
    }
    return null;
  }

  adjustBalance(userId: string, amountNgn: number, type: 'credit' | 'debit'): AdminManagedUser | null {
    const user = this.managedUsers.find(u => u.id === userId);
    if (user) {
      if (type === 'credit') {
        user.balanceNgn += amountNgn;
        walletService.creditWallet(userId, amountNgn, 'adjustment', `adj_${Date.now()}`, 'Manual Admin Balance Adjustment');
      } else {
        user.balanceNgn = Math.max(0, user.balanceNgn - amountNgn);
      }
      return user;
    }
    return null;
  }

  syncAuthUsers(users: any[]) {
    users.forEach(u => {
      const emailLower = (u.email || '').toLowerCase();
      if (!emailLower) return;

      const isAdmin = emailLower === 'visioreach@gmail.com' || emailLower === 'ojalogs@gmail.com' || u.user_metadata?.role === 'administrator' || u.user_metadata?.role === 'admin';
      const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Customer';
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      const existingIndex = this.managedUsers.findIndex(m => m.id === u.id || m.email.toLowerCase() === emailLower);
      if (existingIndex >= 0) {
        this.managedUsers[existingIndex].isVerified = Boolean(u.email_confirmed_at);
        this.managedUsers[existingIndex].createdAt = u.created_at || this.managedUsers[existingIndex].createdAt;
        this.managedUsers[existingIndex].lastActiveAt = u.last_sign_in_at || this.managedUsers[existingIndex].lastActiveAt;
      } else {
        this.managedUsers.push({
          id: u.id,
          name: formattedName,
          email: u.email,
          role: isAdmin ? 'administrator' : 'customer',
          status: 'active',
          balanceNgn: walletService.getBalance(u.id),
          isVerified: Boolean(u.email_confirmed_at),
          totalOrders: 0,
          createdAt: u.created_at || new Date().toISOString(),
          lastActiveAt: u.last_sign_in_at || u.created_at
        });
      }

      // Automatically queue notification if not already present
      if (!isAdmin && !this.notifications.some(n => n.userEmail?.toLowerCase() === emailLower)) {
        this.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'NEW_USER_SIGNUP',
          title: 'New Customer Registered',
          message: `${formattedName} (${u.email}) joined Ojalogs marketplace.`,
          userEmail: u.email,
          timestamp: u.created_at || new Date().toISOString(),
          read: false
        });
      }
    });
  }

  async recordSignupAlert(email: string, name?: string, createdAt?: string): Promise<boolean> {
    const emailLower = email.toLowerCase();
    const isAdmin = emailLower === 'visioreach@gmail.com' || emailLower === 'ojalogs@gmail.com';
    const formattedName = name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
    const timestamp = createdAt || new Date().toISOString();

    const alreadyNotified = this.notifications.some(n => n.userEmail?.toLowerCase() === emailLower);
    if (!alreadyNotified && !isAdmin) {
      this.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'NEW_USER_SIGNUP',
        title: 'New Customer Registered',
        message: `${formattedName} (${email}) verified their account on Ojalogs.`,
        userEmail: email,
        timestamp,
        read: false
      });
    }

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

    await this.dispatchEmailAlert(email, formattedName, timestamp);
    return true;
  }

  async dispatchEmailAlert(userEmail: string, userName: string, registeredAt: string) {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || env.ADMIN_ALERT_EMAIL || 'ojalogs@gmail.com';

    console.log(`[SIGNUP_ALERT] 📧 Queueing email alert to ${adminEmail} for new user ${userEmail}...`);

    if (!brevoApiKey) {
      console.warn(`[SIGNUP_ALERT] ⚠️ BREVO_API_KEY is not set in Render environment variables. Notification queued in admin console only.`);
      return;
    }

    const candidateSenders = [
      process.env.BREVO_SENDER_EMAIL,
      'visioreach@gmail.com',
      'ojalogs@gmail.com',
      'security@ojalogs.com'
    ].filter(Boolean) as string[];

    for (const sender of candidateSenders) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Ojalogs Marketplace Security', email: sender },
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
                  <a href="https://ojalogs.vercel.app/admin" style="background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">Open Admin User Governance Console →</a>
                </div>
              </div>
            `
          })
        });

        if (response.ok) {
          console.log(`[SIGNUP_ALERT] ✓ Success! Admin signup alert dispatched to ${adminEmail} (via sender ${sender})`);
          return;
        } else {
          const errorText = await response.text();
          console.warn(`[SIGNUP_ALERT] Brevo sender ${sender} failed with status ${response.status}: ${errorText}. Trying next candidate...`);
        }
      } catch (err: any) {
        console.warn(`[SIGNUP_ALERT] Network notice with sender ${sender}: ${err.message}`);
      }
    }
  }

  async sendTestAlert(targetEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
    const brevoApiKey = process.env.BREVO_API_KEY || env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return {
        success: false,
        message: 'BREVO_API_KEY is not configured in Render environment variables. Please add BREVO_API_KEY in Render dashboard.'
      };
    }

    const candidateSenders = [
      process.env.BREVO_SENDER_EMAIL,
      'visioreach@gmail.com',
      'ojalogs@gmail.com',
      'security@ojalogs.com'
    ].filter(Boolean) as string[];

    let lastError = '';
    for (const sender of candidateSenders) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Ojalogs Marketplace Security', email: sender },
            to: [{ email: targetEmail, name: 'Ojalogs Super Admin' }],
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
                  <p style="margin: 0; font-size: 13px; color: #15803d;"><strong>Verified Sender:</strong> ${sender}</p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d;"><strong>Recipient:</strong> ${targetEmail}</p>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #15803d;"><strong>Status:</strong> Active & Monitored</p>
                </div>
              </div>
            `
          })
        });

        if (response.ok) {
          console.log(`[TEST_EMAIL] ✓ Successfully sent test alert to ${targetEmail} using sender ${sender}`);
          return { success: true, message: `Email alert successfully delivered to ${targetEmail} (via sender ${sender})` };
        } else {
          const errText = await response.text();
          lastError = `Status ${response.status}: ${errText}`;
          console.warn(`[TEST_EMAIL] Sender ${sender} returned error: ${lastError}. Trying next candidate...`);
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    return {
      success: false,
      message: `Failed to deliver email through Brevo: ${lastError}`
    };
  }
}

export const notificationService = new NotificationService();
