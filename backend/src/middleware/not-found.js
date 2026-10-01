import { AppError } from '../utils/app-error.js';

export function notFound(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'No encontramos lo que buscas'));
}
