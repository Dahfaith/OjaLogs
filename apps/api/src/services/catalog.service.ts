import { Product, APPROVED_CATEGORIES } from '@ojalogs/shared';
import { AppError } from '../middleware/errorHandler.js';
import { encryptPayload, hashFingerprint } from '../utils/crypto.js';
import { INITIAL_PRODUCTS } from '../data/products.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';

function resolveProductImage(title: string, category: string = ''): string {
  const t = (title + ' ' + category).toLowerCase();
  if (t.includes('telegram')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('facebook') || t.includes('bm50') || t.includes('business manager') || t.includes('meta')) {
    return 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('instagram') || t.includes('ig ')) {
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('tiktok')) {
    return 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('twitter') || t.includes(' x ') || t.startsWith('x ') || t.includes('aged x')) {
    return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('gmail') || t.includes('google') || t.includes('email')) {
    return 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('vpn') || t.includes('nord') || t.includes('surfshark') || t.includes('expressvpn')) {
    return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('proxy') || t.includes('proxies') || t.includes('residential')) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('esim') || t.includes('sim') || t.includes('data')) {
    return 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('chatgpt') || t.includes('claude') || t.includes('openai') || t.includes('ai tool') || t.includes('anthropic')) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('card') || t.includes('visa') || t.includes('mastercard') || t.includes('vcc')) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80';
}

export class CatalogService {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private isSynced = false;
  private lastSyncTime = 0;

  async ensureSynced(): Promise<void> {
    const now = Date.now();
    // Cache for 10 minutes before re-checking upstream
    if (this.isSynced && now - this.lastSyncTime < 10 * 60 * 1000) {
      return;
    }
    await this.syncWithLogsPoll();
  }

  async syncWithLogsPoll(): Promise<void> {
    try {
      if (!logspollAdapter.getCredentials().isConfigured) return;

      const upstream = await logspollAdapter.fetchCatalog({ limit: 50 });
      if (upstream && upstream.length > 0) {
        const existingIds = new Set(this.products.map(p => p.id));
        for (const u of upstream) {
          const lpId = `lp_${u.id}`;
          if (!existingIds.has(lpId)) {
            const retailNgn = Math.ceil(u.priceNgn * 1.15); // 15% standard margin
            this.products.push({
              id: lpId,
              slug: `lp-${u.id.slice(0, 8)}`,
              title: u.title,
              category: u.category || 'Social Media Accounts',
              categoryId: 'social-media',
              division: 'A',
              serverCluster: 'Server 2',
              priceNgn: retailNgn,
              inStock: u.stockCount > 0,
              stockCount: u.stockCount,
              rating: 5.0,
              verifiedResale: true,
              coverImage: resolveProductImage(u.title, u.category),
              summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
              descriptionHtml: `<p>${(u.description || u.title).replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng')}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
              specifications: {
                title: u.title,
                category: u.category || 'Social Media Accounts',
                serverOrigin: 'Server 2 (Ojalogs Enterprise Fleet)',
                deliveryType: 'instant_automated',
                validityDuration: 'Permanent Access',
                fulfillmentSpeed: 'Instant Automated (Under 10s)',
                verificationStatus: '100% Verified Ojalogs Stock',
                stockUnits: u.stockCount,
                region: 'Global / Worldwide'
              },
              deliveryFormat: u.deliveryFormat || 'Credentials / 2FA Token',
              validityDuration: 'Permanent',
              region: 'Global',
              featured: false
            });
            existingIds.add(lpId);
          }
        }
      }
      this.isSynced = true;
      this.lastSyncTime = Date.now();
    } catch (err: any) {
      console.warn(`[CATALOG_SYNC_NOTICE] ${err.message}`);
    }
  }

  getCategories() {
    return APPROVED_CATEGORIES;
  }

  getProducts(filters?: { category?: string; serverCluster?: string; search?: string }): Product[] {
    let result = [...this.products];

    if (filters?.serverCluster) {
      result = result.filter(p => p.serverCluster.toLowerCase() === filters.serverCluster!.toLowerCase());
    }

    if (filters?.category) {
      result = result.filter(p => 
        p.categoryId.toLowerCase() === filters.category!.toLowerCase() || 
        p.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.serverCluster.toLowerCase().includes(q)
      );
    }

    return result;
  }

  getProductByIdOrSlug(idOrSlug: string): Product {
    const product = this.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (!product) {
      throw new AppError(`Product "${idOrSlug}" not found`, 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  addEncryptedInventory(productId: string, rawKeysText: string) {
    const lines = rawKeysText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      throw new AppError('No valid keys provided in payload', 400, 'EMPTY_INVENTORY_PAYLOAD');
    }

    const encryptedItems = lines.map(key => ({
      productId,
      encryptedPayload: encryptPayload(key),
      hashFingerprint: hashFingerprint(key),
      status: 'available',
      createdAt: new Date().toISOString()
    }));

    return {
      productId,
      ingestedCount: encryptedItems.length
    };
  }
}

export const catalogService = new CatalogService();
