import ApiError from '../utils/ApiError.js';

const formatError = (err, req) => {
      if (
            err.name === 'MongooseServerSelectionError' ||
            err.name === 'MongoServerSelectionError' ||
            err.name === 'MongoNetworkError' ||
            (err.name === 'MongooseError' && /buffering timed out/i.test(err.message))
      ) {
            return {
                  statusCode: 503,
                  message: 'Database connection failed. Please try again shortly.',
                  code: 'DATABASE_UNAVAILABLE',
            };
      }
      let statusCode = err.statusCode || 500;
      let message = err.message || 'Internal Server Error';
      let code = err.code || 'INTERNAL_ERROR';

      if (err.name === 'CastError') {
            statusCode = 404;
            message = 'Resource not found';
            code = 'INVALID_ID';
      }

      if (err.code === 11000) {
            statusCode = 400;
            const field = Object.keys(err.keyValue || {})[0] || 'field';
            const value = err.keyValue?.[field];
            message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists`;
            code = 'DUPLICATE_KEY';
      }

      if (err.name === 'ValidationError') {
            statusCode = 400;
            message = Object.values(err.errors).map((e) => e.message).join('. ');
            code = 'VALIDATION_ERROR';
      }

      if (err.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Invalid token. Please log in again.';
            code = 'INVALID_TOKEN';
      }

      if (err.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Token expired. Please log in again.';
            code = 'TOKEN_EXPIRED';
      }

      if (err.code === 'LIMIT_FILE_SIZE') {
            statusCode = 400;
            message = 'File too large. Maximum size allowed is 5MB.';
            code = 'FILE_TOO_LARGE';
      }

      if (err.code === 'LIMIT_FILE_COUNT') {
            statusCode = 400;
            message = 'Too many files uploaded.';
            code = 'TOO_MANY_FILES';
      }

      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            statusCode = 400;
            message = `Unexpected field: ${err.field}`;
            code = 'UNEXPECTED_FILE';
      }

      if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
            statusCode = 400;
            message = 'Invalid JSON in request body';
            code = 'INVALID_JSON';
      }

      return { statusCode, message, code };
};

const errorHandler = (err, req, res, next) => {
      const { statusCode, message, code } = formatError(err, req);

      const logPayload = {
            method: req.method,
            url: req.originalUrl,
            statusCode,
            code,
            message: err.message,
      };

      if (statusCode >= 500) {
            console.error('\n❌ Server Error:', logPayload);
            if (process.env.NODE_ENV === 'development' && err.stack) {
                  console.error(err.stack.split('\n').slice(0, 6).join('\n'));
            }
      } else if (process.env.NODE_ENV === 'development') {
            console.warn(`\n⚠️  [${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
      }

      if (res.headersSent) {
            return next(err);
      }

      const payload = {
            success: false,
            message,
            code,
      };

      if (err.retryAfterSeconds != null) payload.retryAfterSeconds = err.retryAfterSeconds;
      if (err.blockedUntil) payload.blockedUntil = err.blockedUntil;
      if (err.attempts != null) payload.attempts = err.attempts;

      res.status(statusCode).json({
            ...payload,
            ...(process.env.NODE_ENV === 'development' && {
                  error: err.name,
                  stack: err.stack?.split('\n').slice(0, 8),
            }),
      });
};

export { ApiError };
export default errorHandler;
