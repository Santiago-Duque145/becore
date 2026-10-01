import { AppError } from '../utils/app-error.js';

export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part]);
    if (!result.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Revisa los datos enviados',
        result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      );
    }
    if (part === 'query') req.validatedQuery = result.data;
    else req[part] = result.data;
  }
  next();
};
