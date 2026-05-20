export default class ApiError extends Error {
      constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', meta = {}) {
            super(message);
            this.name = 'ApiError';
            this.statusCode = statusCode;
            this.code = code;
            this.meta = meta;
            Object.assign(this, meta);
            this.isOperational = true;
            Error.captureStackTrace(this, this.constructor);
      }
}

export const badRequest = (message, code = 'BAD_REQUEST') => new ApiError(message, 400, code);
export const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') => new ApiError(message, 401, code);
export const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') => new ApiError(message, 403, code);
export const notFound = (message = 'Not found', code = 'NOT_FOUND') => new ApiError(message, 404, code);
