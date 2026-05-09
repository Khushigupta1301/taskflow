const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose CastError (invalid ObjectId)
const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}.`, 400);

// Handle Mongoose duplicate key error
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists. Please use a different value.`, 409);
};

// Handle Mongoose validation errors
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 422);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, name: err.name };

  // Log the error
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl}`);

  // Transform known Mongoose errors into AppErrors
  if (error.name === 'CastError') error = handleCastError(error);
  if (error.code === 11000) error = handleDuplicateKey(error);
  if (error.name === 'ValidationError') error = handleValidationError(error);

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
};

module.exports = { errorHandler, notFound, AppError };
module.exports.default = AppError;
