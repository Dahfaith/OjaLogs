import { Product, APPROVED_CATEGORIES } from '@ojalogs/shared';
import { AppError } from '../middleware/errorHandler.js';
import { encryptPayload, hashFingerprint } from '../utils/crypto.js';
import { INITIAL_PRODUCTS } from '../data/products.js';

export class CatalogService {
  private products: Product[] = [...INITIAL_PRODUCTS];

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
