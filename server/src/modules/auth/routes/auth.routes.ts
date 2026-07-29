import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { validateBody } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import { authRateLimiter } from '../../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), authController.login);
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, auditLog, validateBody(updateProfileSchema), authController.updateMe);
router.patch(
  '/me/password',
  authenticate,
  auditLog,
  validateBody(changePasswordSchema),
  authController.changePassword,
);

export default router;
