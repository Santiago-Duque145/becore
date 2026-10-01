import { AppError } from '../utils/app-error.js';

export const requireRole = (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
    }
    next();
  };
