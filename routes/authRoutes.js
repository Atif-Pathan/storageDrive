// routes/authRoutes.js
const { Router } = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
// const { requireAuth } = require('../middleware/authRelated');
const authRouter = Router();

authRouter.get('/signup', authController.getSignUp);
authRouter.post('/signup', authController.postSignUp);

module.exports = authRouter;