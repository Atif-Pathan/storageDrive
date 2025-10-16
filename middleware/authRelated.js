// middleware/authRelated.js
// Make user available to templates
const attachUser = (req, res, next) => {
  res.locals.currentUser = req.user;
  next();
};

// Require authentication
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('❌ AUTH FAILED - Redirecting to login');
  }
  
  res.redirect(
    '/auth/login?error=You need to be logged in to access this page.'
  );
};

module.exports = { attachUser, requireAuth };