// src/types/express.d.ts
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: {
        id: string;
        // Add more if needed
      };
    }
  }
}
