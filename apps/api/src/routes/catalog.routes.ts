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

router.get('/products', (req, res) => {
  const { category, serverCluster, search } = req.query;
  const products = catalogService.getProducts({
    category: typeof category === 'string' ? category : undefined,
    serverCluster: typeof serverCluster === 'string' ? serverCluster : undefined,
    search: typeof search === 'string' ? search : undefined
  });

  res.json({
    success: true,
    data: products,
    meta: { count: products.length, request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.get('/products/:idOrSlug', (req, res, next) => {
  try {
    const idOrSlug = Array.isArray(req.params.idOrSlug) ? req.params.idOrSlug[0] : req.params.idOrSlug;
    const product = catalogService.getProductByIdOrSlug(idOrSlug);
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
