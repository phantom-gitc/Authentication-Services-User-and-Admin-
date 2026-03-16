const express = require('express');
const validators = require('../middlewares/validator.middleware');
const authController = require('../controller/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');





const router = express.Router();

// Register  POST:  auth/register
router.post('/register',validators.registerUserValidation,authController.registerUser);

// Login POST: /auth/login
router.post('/login',validators.loginValidation,authController.loginUser);

// Get current user data GET: /auth/me
router.get('/me',authMiddleware.authMiddleware, authController.getCurrentUser);

// Logout GET: /auth/logout
router.get('/logout', authMiddleware.authMiddleware, authController.logoutUser);

// Addresses routes
router.get('/users/me/addresses', authMiddleware.authMiddleware, authController.listAddresses);
router.post('/users/me/addresses', authMiddleware.authMiddleware, authController.addAddress);
router.delete('/users/me/addresses/:addressId', authMiddleware.authMiddleware, authController.deleteAddress);


module.exports = router;

