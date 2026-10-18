import { Router } from 'express';
import { publicStats } from '../controllers/public.controller.js';

// Rutas sin autenticación: solo datos agregados, nunca personales (api.md, Sistema y perfil)
const router = Router();

router.get('/public/stats', publicStats);

export default router;
