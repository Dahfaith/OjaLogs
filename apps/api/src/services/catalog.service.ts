import { Product, APPROVED_CATEGORIES, resolveProductCategory } from '@ojalogs/shared';
import { AppError } from '../middleware/errorHandler.js';
import { encryptPayload, hashFingerprint } from '../utils/crypto.js';
import { INITIAL_PRODUCTS } from '../data/products.js';
import { logspollAdapter } from '../adapters/logspoll/logspoll.adapter.js';

function resolveProductImage(title: string, category: string = '', description: string = ''): string {
  const t = title.toLowerCase();
  const c = category.toLowerCase();
  const d = description.toLowerCase();

  // Helper matcher: check title first, then category/description
  const match = (regex: RegExp) => regex.test(t) || regex.test(c) || regex.test(d);
  const matchTitle = (regex: RegExp) => regex.test(t);

  // 1. PAYMENT & GIFT CARDS (PRIORITY 1 - never misclassify as social)
  if (matchTitle(/\b(mastercard|master\s*card)\b/i)) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(visa|visa\s*card|vcc)\b/i)) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(amex|american\s*express|vanilla)\b/i)) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(amazon|amazon\s*gift)\b/i)) {
    return 'https://images.unsplash.com/photo-1523474255658-4af61b168344?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(apple|itunes|app\s*store)\b/i)) {
    return 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(google\s*play|play\s*store)\b/i)) {
    return 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(steam|steam\s*wallet)\b/i)) {
    return 'https://images.unsplash.com/photo-1612287271186-47b0a70f555d?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(razer|razer\s*gold)\b/i)) {
    return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(playstation|psn|xbox|roblox)\b/i)) {
    return 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(gift\s*card|prepaid|virtual\s*card|debit\s*card|credit\s*card)\b/i)) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }

  // 2. VIRTUAL NUMBERS & TELEPHONY
  if (matchTitle(/\b(google\s*voice|gvoice)\b/i)) {
    return 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(textnow|talkatone)\b/i)) {
    return 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(whatsapp|wa\s*business)\b/i)) {
    return 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(telegram|tdata|\.session|tg\b)/i)) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(esim|roaming|sim\s*card)\b/i)) {
    return 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80';
  }

  // 3. EMAIL PROVIDERS
  if (matchTitle(/\b(outlook|hotmail)\b/i)) {
    return 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(yahoo|yahoomail)\b/i)) {
    return 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(proton|protonmail)\b/i)) {
    return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(gmail|google\s*workspace|gsuite)\b/i)) {
    return 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=600&q=80';
  }

  // 4. AI & DEVELOPER TOOLS
  if (matchTitle(/\b(chatgpt|openai|gpt-4|claude|anthropic|midjourney|capcut|gemini|kling|ai\s*tool)\b/i)) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(github|gitlab|git)\b/i)) {
    return 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=600&q=80';
  }

  // 5. VPN & PROXIES
  if (matchTitle(/\b(vpn|nord|surfshark|expressvpn|cyberghost)\b/i)) {
    return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(proxy|proxies|residential|rotating|socks5)\b/i)) {
    return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80';
  }

  // 6. STREAMING & MEDIA
  if (matchTitle(/\b(netflix)\b/i)) {
    return 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(spotify)\b/i)) {
    return 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(youtube|yt\s*sub)\b/i)) {
    return 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=600&q=80';
  }

  // 7. SOCIAL MEDIA PLATFORMS (STRICT regex - Threads precedes Instagram)
  if (matchTitle(/\b(threads?)\b/i) || t.includes('thread')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(twitter|aged\s*x|x\.com|x\s*\(twitter\)|twitter\s*account)\b/i)) {
    return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(instagram|instagram\s*account|aged\s*creator|\big\b)/i)) {
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(facebook|bm50|business\s*manager|facebook\s*account|\bfb\b)/i)) {
    return 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(tiktok|tik\s*tok)\b/i)) {
    return 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(reddit)\b/i)) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(snapchat)\b/i)) {
    return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80';
  }
  if (matchTitle(/\b(discord)\b/i)) {
    return 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=600&q=80';
  }

  // 8. SECONDARY FALLBACK: Match Category if Title gave no match
  if (match(/\b(mastercard|visa|card|cards|gift\s*card)\b/i)) {
    return 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(vpn)\b/i)) {
    return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(ai|chatgpt|openai)\b/i)) {
    return 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(instagram)\b/i)) {
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(facebook)\b/i)) {
    return 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(twitter)\b/i)) {
    return 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=600&q=80';
  }
  if (match(/\b(tiktok)\b/i)) {
    return 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?auto=format&fit=crop&w=600&q=80';
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
  private products: Product[] = INITIAL_PRODUCTS.map(p => {
    const { category, categoryId } = resolveProductCategory(p.title, p.category, p.descriptionHtml);
    return {
      ...p,
      category,
      categoryId,
      specifications: {
        ...p.specifications,
        category
      }
    };
  });
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
            const { category: resolvedCat, categoryId: resolvedCatId } = resolveProductCategory(u.title, u.category, u.description);
            const prodObj: Product = {
              id: lpId,
              slug: `lp-${u.id.slice(0, 8)}`,
              title: u.title,
              category: resolvedCat,
              categoryId: resolvedCatId,
              division: 'A',
              serverCluster: normalizeServerCluster(u.serverCluster),
              priceNgn: retailNgn,
              inStock: u.stockCount > 0,
              stockCount: u.stockCount,
              rating: 5.0,
              verifiedResale: true,
              coverImage: resolveProductImage(u.title, resolvedCat, u.description),
              summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
              descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
              specifications: {
                title: u.title,
                category: resolvedCat,
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
        const categoryQueryMap: Record<string, string> = {
          'social-media': 'account',
          'gift-cards': 'card',
          'cards': 'card',
          'mastercard': 'mastercard',
          'visa': 'visa',
          'email': 'mail',
          'gmail': 'gmail',
          'vpn': 'vpn',
          'proxies': 'proxy',
          'esim': 'esim',
          'ai-tools': 'ai',
          'ai': 'ai',
          'streaming': 'netflix',
          'software': 'license',
          'cloud-hosting': 'vps',
          'virtual-numbers': 'voice',
          'instagram': 'instagram',
          'facebook': 'facebook',
          'twitter': 'twitter',
          'tiktok': 'tiktok',
          'threads': 'threads',
          'telegram': 'telegram',
          'snapchat': 'snapchat',
          'reddit': 'reddit'
        };

        if (!effectiveQuery && categoryQueryMap[lowerCat]) {
          effectiveQuery = categoryQueryMap[lowerCat];
        } else if (effectiveQuery && categoryQueryMap[lowerCat]) {
          effectiveQuery = `${effectiveQuery} ${categoryQueryMap[lowerCat]}`;
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
            const { category: resolvedCat, categoryId: resolvedCatId } = resolveProductCategory(u.title, u.category, u.description);
            const prodObj: Product = {
              id: lpId,
              slug: u.slug || `lp-${u.id.slice(0, 8)}`,
              title: u.title,
              category: resolvedCat,
              categoryId: resolvedCatId,
              division: 'A',
              serverCluster: normalizeServerCluster(u.serverCluster || (serverNum ? `Server ${serverNum}` : 'Server 2')),
              priceNgn: retailNgn,
              inStock: u.stockCount > 0,
              stockCount: u.stockCount,
              rating: 5.0,
              verifiedResale: true,
              coverImage: resolveProductImage(u.title, resolvedCat, u.description),
              summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
              descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
              specifications: {
                title: u.title,
                category: resolvedCat,
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

          // Post-filter by resolved category to prevent cross-category leakage
          let finalProducts = products;
          if (category && category !== 'All') {
            finalProducts = products.filter(p => {
              if (lowerCat === 'social-media') {
                return p.categoryId === 'social-media' || ['threads', 'instagram', 'facebook', 'twitter', 'tiktok', 'telegram', 'snapchat', 'reddit'].includes(p.categoryId as string);
              }
              if (lowerCat === 'gift-cards' || lowerCat === 'cards') {
                return p.categoryId === 'gift-cards';
              }
              if (lowerCat === 'email' || lowerCat === 'gmail') {
                return p.categoryId === 'email';
              }
              if (lowerCat === 'ai-tools' || lowerCat === 'ai') {
                return p.categoryId === 'ai-tools';
              }
              if (lowerCat === 'vpn') {
                return p.categoryId === 'vpn';
              }
              return p.categoryId === lowerCat || p.category.toLowerCase().includes(lowerCat);
            });
          }

          const result: CatalogPaginationResult = {
            products: finalProducts,
            pagination: {
              page: lpResult.page,
              limit: lpResult.limit,
              total: finalProducts.length < products.length ? finalProducts.length : lpResult.total,
              totalPages: finalProducts.length < products.length ? Math.max(1, Math.ceil(finalProducts.length / limit)) : lpResult.pages,
              inStock: finalProducts.filter(p => p.inStock).length,
              outOfStock: finalProducts.filter(p => !p.inStock).length
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
      const catLower = filters.category.toLowerCase();
      result = result.filter(p => {
        const resolved = resolveProductCategory(p.title, p.category, p.descriptionHtml);
        if (resolved.categoryId.toLowerCase() === catLower || resolved.category.toLowerCase() === catLower) {
          return true;
        }
        if (p.categoryId.toLowerCase() === catLower || p.category.toLowerCase() === catLower) {
          return true;
        }
        const t = p.title.toLowerCase();
        if (catLower === 'cards' || catLower === 'gift-cards') {
          return resolved.categoryId === 'gift-cards' || /\b(mastercard|visa|card|gift\s*card)\b/i.test(t);
        }
        if (catLower === 'ai' || catLower === 'ai-tools') {
          return resolved.categoryId === 'ai-tools' || /\b(ai|chatgpt|openai)\b/i.test(t);
        }
        if (catLower === 'gmail' || catLower === 'email') {
          return resolved.categoryId === 'email' || /\b(gmail|google\s*mail)\b/i.test(t);
        }
        return t.includes(catLower);
      });
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
        const { category: resolvedCat, categoryId: resolvedCatId } = resolveProductCategory(u.title, u.category, u.description);
        const prodObj: Product = {
          id: lpId,
          slug: u.slug || `lp-${u.id.slice(0, 8)}`,
          title: u.title,
          category: resolvedCat,
          categoryId: resolvedCatId,
          division: 'A',
          serverCluster: normalizeServerCluster(u.serverCluster),
          priceNgn: retailNgn,
          inStock: u.stockCount > 0,
          stockCount: u.stockCount,
          rating: 5.0,
          verifiedResale: true,
          coverImage: resolveProductImage(u.title, resolvedCat, u.description),
          summary: 'Verified authentic digital account/tool backed by Ojalogs automated fulfillment.',
          descriptionHtml: `<p>${(u.description || u.title).replace(/<\/?(p|div|br)\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/LogsPoll/gi, 'Ojalogs').replace(/logspoll\.com/gi, 'ojalogs.com.ng').trim()}</p><p>Guaranteed authentic delivery via Ojalogs automated infrastructure. 100% replacement guarantee if credentials fail first-time verification.</p>`,
          specifications: {
            title: u.title,
            category: resolvedCat,
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
