import { ZodError } from 'zod';

/**
 * Validation middleware factory
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const validated = schema.parse(req.body);
      
      // Replace req.body with validated data (ensures type safety)
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into user-friendly messages
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      
      // Pass other errors to error handler
      next(error);
    }
  };
};

export default validate;
