import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

const RegisterSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the Acceptable Use Policy')
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/register', authLimiter, validateBody(RegisterSchema), (req, res) => {
  const { firstName, lastName, email } = req.body;
  res.status(201).json({
    success: true,
    data: {
      userId: `usr_oj_${Date.now()}`,
      email,
      name: `${firstName} ${lastName}`,
      message: 'Account created successfully. Please verify your email.'
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

router.post('/login', authLimiter, validateBody(LoginSchema), (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    data: {
      token: 'mock_jwt_customer_token_ojalogs_valid',
      user: {
        id: 'usr_oj_001',
        email,
        name: 'Katie Mille',
        role: 'customer',
        isVerified: true
      }
    },
    meta: { request_id: `req_${Date.now()}`, timestamp: new Date().toISOString() }
  });
});

export const authRouter = router;

