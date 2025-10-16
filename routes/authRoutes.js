// routes/authRoutes.js
const { Router } = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const authRouter = Router();

authRouter.get('/signup', authController.getSignUp);
authRouter.post('/signup', authController.postSignUp);

authRouter.get('/login', authController.getLogin);
authRouter.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/mydrive',
    failureRedirect: '/auth/login?error=Invalid email or password.',
  }),
);

authRouter.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/?success=You have been logged out.');
  });
});

module.exports = authRouter;