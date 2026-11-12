import { Router } from 'express';
import { catalogService } from '../services/catalog.service.js';
import { serverApiRegistry } from '../adapters/server/server.registry.js';

const router = Router();

router.get('/categories', (req, res) => {
  const categories = catalogService.getCategories();
  res.json({
    success: true,
    data: categories,
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.get('/products', async (req, res, next) => {
  try {
    await catalogService.ensureSynced();
    const { category, serverCluster, search, q, page, limit, availability } = req.query;

    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    const querySearch = (typeof search === 'string' ? search : typeof q === 'string' ? q : undefined);

    const result = await catalogService.getCatalogPaginated({
      page: pageNum,
      limit: limitNum,
      search: querySearch,
      category: typeof category === 'string' ? category : undefined,
      serverCluster: typeof serverCluster === 'string' ? serverCluster : undefined,
      availability: typeof availability === 'string' ? availability : undefined
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      meta: {
        pagination: result.pagination,
        count: result.products.length,
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:idOrSlug', async (req, res, next) => {
  try {
    await catalogService.ensureSynced();
    const idOrSlug = Array.isArray(req.params.idOrSlug) ? req.params.idOrSlug[0] : req.params.idOrSlug;
    const product = await catalogService.getProductByIdOrSlugAsync(idOrSlug);
    res.json({
      success: true,
      data: product,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/servers/health', async (req, res, next) => {
  try {
    const health = await serverApiRegistry.getAllHealth();
    res.json({
      success: true,
      data: health,
      meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
});

export const catalogRouter = router;
