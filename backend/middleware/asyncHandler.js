/**
 * Wrap async route handlers — forwards errors to global error middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
