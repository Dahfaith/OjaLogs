import { Product, APPROVED_CATEGORIES } from '@ojalogs/shared';
import { AppError } from '../middleware/errorHandler.js';
import { encryptPayload, hashFingerprint } from '../utils/crypto.js';
import { INITIAL_PRODUCTS } from '../data/products.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';

function resolveProductImage(title: string, category: string = ''): string {
  const t = (title + ' ' + category).toLowerCase();

  // 1. High-Priority: Mastercard, Visa, Prepaid Virtual Cards, Gift Cards
  if (
    t.includes('mastercard') ||
    t.includes('visa') ||
    t.includes('prepaid') ||
    t.includes('gift card') ||
    t.includes('vcc') ||
    t.includes('credit card') ||
    t.includes('debit card') ||
    t.includes('virtual card') ||
    /\b(card|cards|amex|vanilla)\b/i.test(t)
  ) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }

  // 2. GitHub
  if (t.includes('github') || /\b(git)\b/i.test(t)) {
    return 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=600&q=80';
  }

  // 3. X / Twitter
  if (
    t.includes('twitter') ||
    t.includes('aged x') ||
    t.includes('x.com') ||
    t.includes('x (twitter)') ||
    t.includes('twitter account') ||
    /\b(twitter|x account|twitter x)\b/i.test(t)
  ) {
    return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80';
  }

  // 4. Instagram (STRICT: Never match bare 'insta' to prevent 'instant' collisions)
  if (
    t.includes('instagram') ||
    /\b(ig)\b/i.test(t) ||
    t.includes('aged creator') ||
    t.includes('russian instagram') ||
    t.includes('brazil instagram') ||
    t.includes('instagram account')
  ) {
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80';
  }

  // 5. Facebook / Meta
  if (
    t.includes('facebook') ||
    t.includes('bm50') ||
    t.includes('business manager') ||
    t.includes('facebook account') ||
    /\b(fb|meta)\b/i.test(t)
  ) {
    return 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=600&q=80';
  }

  // 6. Telegram
  if (t.includes('telegram') || t.includes('t.me') || /\b(tg)\b/i.test(t)) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }

  // 7. TikTok
  if (t.includes('tiktok') || t.includes('tik tok')) {
    return 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?auto=format&fit=crop&w=600&q=80';
  }

  // 8. Gmail / Google Workspace / YouTube
  if (
    t.includes('gmail') ||
    t.includes('google') ||
    t.includes('workspace') ||
    t.includes('gsuite') ||
    t.includes('gdrive') ||
    t.includes('youtube')
  ) {
    return 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=600&q=80';
  }

  // 9. VPN & Security
  if (
    t.includes('vpn') ||
    t.includes('nord') ||
    t.includes('surfshark') ||
    t.includes('expressvpn') ||
    t.includes('cyberghost')
  ) {
    return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80';
  }

  // 10. Proxies & Residential IPs
  if (
    t.includes('proxy') ||
    t.includes('proxies') ||
    t.includes('residential') ||
    t.includes('rotating') ||
    t.includes('socks5')
  ) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
  }

  // 11. eSIM & Roaming Data
  if (t.includes('esim') || t.includes('roaming') || /\b(sim)\b/i.test(t)) {
    return 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80';
  }

  // 12. AI Tools & Subscriptions
  if (
    t.includes('chatgpt') ||
    t.includes('claude') ||
    t.includes('openai') ||
    t.includes('midjourney') ||
    t.includes('gemini') ||
    t.includes('anthropic') ||
    t.includes('ai tool')
  ) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80';
  }

  // 13. Windows / Microsoft / Office
  if (
    t.includes('windows') ||
    t.includes('office') ||
    t.includes('microsoft') ||
    t.includes('license key') ||
    t.includes('os key')
  ) {
    return 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80';
  }

  // 14. Crypto & Fintech
  if (t.includes('binance') || t.includes('crypto') || t.includes('bybit') || t.includes('coinbase')) {
    return 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80';
  }

  // 15. Canva & Design
  if (t.includes('canva') || t.includes('adobe') || t.includes('photoshop')) {
    return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80';
  }

  // 16. Streaming (Spotify, Netflix)
  if (t.includes('spotify')) {
    return 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('netflix')) {
    return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80';
  }

  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80';
}

function normalizeServerCluster(val?: string | number): 'Server 1' | 'Server 2' | 'Server 3' | 'Server 4' {
  const str = String(val || '2');
  if (str.includes('1')) return 'Server 1';
  if (str.includes('3')) return 'Server 3';
  if (str.includes('4')) return 'Server 4';
  return 'Server 2';
}

export interface CatalogPaginationResult {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    inStock: number;
    outOfStock: number;
  };
}

export class CatalogService {
  private products: Product[] = [...INITIAL_PRODUCTS];
  private isSynced = false;
  private lastSyncTime = 0;
  private cache = new Map<string, { data: CatalogPaginationResult; expiresAt: number }>();
  private productDetailsCache = new Map<string, Product>();

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
      this.cache.clear();
      if (!logspollAdapter.getCredentials().isConfigured) return;

      const upstream = await logspollAdapter.fetchCatalog({ limit: 50 });
      if (upstream && upstream.length > 0) {
        const existingIds = new Set(this.products.map(p => p.id));
        for (const u of upstream) {
          const lpId = `lp_${u.id}`;
          if (!existingIds.has(lpId)) {
            const retailNgn = Math.ceil(u.priceNgn * 1.15); // 15% standard margin
            const prodObj: Product = {
              id: lpId,
              slug: `lp-${u.id.slice(0, 8)}`,
              title: u.title,
              category: u.category || 'Social Media Accounts',
              categoryId: 'social-media',
              division: 'A',
              serverCluster: normalizeServerCluster(u.serverCluster),
              priceNgn: retailNgn,
              inStock: u.stockCount > 0,
              stockCount: u.stockCount,
              rating: 5.0,
              verifiedResale: true,
              coverImage: resolveProductImage(u.title, u.category),
              summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
              descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
              specifications: {
                title: u.title,
                category: u.category || 'Social Media Accounts',
                serverOrigin: `${u.serverCluster || 'Server 2'} (Ojalogs Enterprise Fleet)`,
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
            };
            this.products.push(prodObj);
            this.productDetailsCache.set(lpId, prodObj);
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

  async getCatalogPaginated(options: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    serverCluster?: string;
    availability?: string;
  }): Promise<CatalogPaginationResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const search = (options.search || '').trim();
    const category = (options.category || '').trim();
    const serverCluster = (options.serverCluster || '').trim();
    const availability = (options.availability || '').trim();

    const cacheKey = `p_${page}_l_${limit}_s_${search}_c_${category}_sc_${serverCluster}_a_${availability}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Check if upstream LogsPoll API is configured
    if (logspollAdapter.getCredentials().isConfigured) {
      try {
        let serverNum: number | undefined;
        if (serverCluster && serverCluster !== 'All' && serverCluster !== 'Favourites') {
          const match = serverCluster.match(/\d+/);
          if (match) serverNum = Number(match[0]);
        }

        // Determine effective query term
        let effectiveQuery = search;
        const lowerCat = category.toLowerCase();
        const knownPlatforms = ['instagram', 'facebook', 'twitter', 'tiktok', 'gmail', 'vpn', 'telegram', 'github', 'card', 'cards', 'mastercard', 'visa', 'ai'];
        if (!effectiveQuery && knownPlatforms.includes(lowerCat)) {
          if (lowerCat === 'cards' || lowerCat === 'mastercard') {
            effectiveQuery = 'card';
          } else {
            effectiveQuery = lowerCat === 'twitter' ? 'twitter' : lowerCat;
          }
        } else if (effectiveQuery && knownPlatforms.includes(lowerCat)) {
          effectiveQuery = `${effectiveQuery} ${lowerCat === 'cards' ? 'card' : lowerCat}`;
        }

        const lpResult = await logspollAdapter.fetchCatalogPaginated({
          page,
          limit,
          q: effectiveQuery || undefined,
          server: serverNum,
          availability: availability === 'in_stock' ? 'in-stock' : availability === 'out_of_stock' ? 'out-of-stock' : undefined
        });

        if (lpResult.records && lpResult.records.length > 0) {
          const products: Product[] = lpResult.records.map(u => {
            const lpId = `lp_${u.id}`;
            const retailNgn = Math.ceil(u.priceNgn * 1.15); // 15% standard margin
            const prodObj: Product = {
              id: lpId,
              slug: u.slug || `lp-${u.id.slice(0, 8)}`,
              title: u.title,
              category: u.category || 'Social Media Accounts',
              categoryId: 'social-media',
              division: 'A',
              serverCluster: normalizeServerCluster(u.serverCluster || (serverNum ? `Server ${serverNum}` : 'Server 2')),
              priceNgn: retailNgn,
              inStock: u.stockCount > 0,
              stockCount: u.stockCount,
              rating: 5.0,
              verifiedResale: true,
              coverImage: resolveProductImage(u.title, u.category),
              summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
              descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
              specifications: {
                title: u.title,
                category: u.category || 'Social Media Accounts',
                serverOrigin: `${u.serverCluster || 'Server 2'} (Ojalogs Enterprise Fleet)`,
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
            };

            // Register into details cache
            this.productDetailsCache.set(lpId, prodObj);
            this.productDetailsCache.set(prodObj.slug, prodObj);
            return prodObj;
          });

          const result: CatalogPaginationResult = {
            products,
            pagination: {
              page: lpResult.page,
              limit: lpResult.limit,
              total: lpResult.total,
              totalPages: lpResult.pages,
              inStock: lpResult.inStock,
              outOfStock: lpResult.outOfStock
            }
          };

          // Cache for 3 minutes
          this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + 3 * 60 * 1000 });
          return result;
        }
      } catch (err: any) {
        console.warn(`[CATALOG_PAGINATED_PROXY] Upstream notice: ${err.message}`);
      }
    }

    // Fallback: in-memory pagination over local products
    let pool = this.getProducts({
      category: category && category !== 'All' ? category : undefined,
      serverCluster: serverCluster && serverCluster !== 'All' && serverCluster !== 'Favourites' ? serverCluster : undefined,
      search: search || undefined
    });

    if (availability === 'in_stock') {
      pool = pool.filter(p => p.inStock);
    } else if (availability === 'out_of_stock') {
      pool = pool.filter(p => !p.inStock);
    }

    const total = pool.length;
    const inStock = pool.filter(p => p.inStock).length;
    const outOfStock = total - inStock;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paged = pool.slice(offset, offset + limit);

    const result: CatalogPaginationResult = {
      products: paged,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        inStock,
        outOfStock
      }
    };

    return result;
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

  async getProductByIdOrSlugAsync(idOrSlug: string): Promise<Product> {
    // 1. Check local catalog
    const local = this.products.find(p => p.id === idOrSlug || p.slug === idOrSlug);
    if (local) return local;

    // 2. Check details cache
    const cached = this.productDetailsCache.get(idOrSlug);
    if (cached) return cached;

    // 3. If upstream is configured, fetch live
    if (logspollAdapter.getCredentials().isConfigured) {
      const cleanId = idOrSlug.replace(/^lp_/, '').replace(/^lp-/, '');
      const u = await logspollAdapter.fetchProduct(cleanId);
      if (u) {
        const lpId = `lp_${u.id}`;
        const retailNgn = Math.ceil(u.priceNgn * 1.15);
        const prodObj: Product = {
          id: lpId,
          slug: u.slug || `lp-${u.id.slice(0, 8)}`,
          title: u.title,
          category: u.category || 'Social Media Accounts',
          categoryId: 'social-media',
          division: 'A',
          serverCluster: normalizeServerCluster(u.serverCluster),
          priceNgn: retailNgn,
          inStock: u.stockCount > 0,
          stockCount: u.stockCount,
          rating: 5.0,
          verifiedResale: true,
          coverImage: resolveProductImage(u.title, u.category),
          summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
          descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
          specifications: {
            title: u.title,
            category: u.category || 'Social Media Accounts',
            serverOrigin: `${u.serverCluster || 'Server 2'} (Ojalogs Enterprise Fleet)`,
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
        };
        this.products.push(prodObj);
        this.productDetailsCache.set(lpId, prodObj);
        this.productDetailsCache.set(prodObj.slug, prodObj);
        return prodObj;
      }
    }

    throw new AppError(`Product "${idOrSlug}" not found`, 404, 'PRODUCT_NOT_FOUND');
  }

  getProductByIdOrSlug(idOrSlug: string): Product {
    const product = this.products.find(p => p.id === idOrSlug || p.slug === idOrSlug) || this.productDetailsCache.get(idOrSlug);
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
