import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// OAuth token validation rules
export const validateOAuthToken = [
  body('code')
    .notEmpty()
    .withMessage('Code is required')
    .isString()
    .withMessage('Code must be a string')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Code must be between 1 and 1000 characters')
    .trim()
    .escape(), // Sanitize input
  
  // Validation error handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for OAuth token request', {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request parameters',
        details: errors.array().map(error => ({
          field: 'param' in error ? error.param : 'unknown',
          message: error.msg,
          value: 'value' in error ? error.value : 'unknown'
        }))
      });
    }
    
    next();
  }
];

// General validation error handler that can be reused
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      errors: errors.array(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid request parameters',
      details: errors.array().map(error => ({
        field: 'param' in error ? error.param : 'unknown',
        message: error.msg,
        value: 'value' in error ? error.value : 'unknown'
      }))
    });
  }
  
  next();
}; 