/**
 * User-Friendly Validation Pipe
 * Converts technical Zod validation errors to user-friendly messages
 */
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class UserFriendlyValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod errors to user-friendly messages
        const friendlyErrors = error.errors.map(err => {
          const field = err.path.join('.');

          // Custom user-friendly messages based on field and error type
          if (field === 'identifier') {
            if (err.code === 'too_small') {
              return 'Email address is required';
            }
            if (err.message.includes('valid email')) {
              return 'Please enter a valid email address';
            }
            return 'Please enter a valid email address';
          }

          if (field === 'password') {
            if (err.code === 'too_small') {
              return 'Password is required';
            }
            return 'Password is required';
          }

          // Default to original message for other fields
          return err.message;
        });

        // Return the first user-friendly error
        throw new BadRequestException({
          success: false,
          error: 'Validation Error',
          message: friendlyErrors[0] || 'Please check your input and try again',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
        });
      }

      throw new BadRequestException('Invalid request data');
    }
  }
}
