import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/require-auth.js';
import { requireRole } from '../middleware/require-role.js';
import { validate } from '../middleware/validate.js';
import { searchPlaces } from '../services/geocode.service.js';

const router = Router();

const geocodeQuerySchema = z.object({
  q: z.string().trim().min(3, 'Escribe al menos 3 caracteres').max(120, 'La búsqueda es demasiado larga'),
});

// Buscador de direcciones del formulario de evento (solo organizadores)
router.get('/geocode', requireAuth, requireRole('organizer'), validate({ query: geocodeQuerySchema }), async (req, res) => {
  res.json({ data: await searchPlaces(req.validatedQuery.q) });
});

export default router;
