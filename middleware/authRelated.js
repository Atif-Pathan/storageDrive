// middleware/authRelated.js
const prismaClient = require("../config/prismaClient");

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

const verifyFolderOwnership = async (folderId, userId) => {
  if (!folderId) return null;
  
  const folder = await prismaClient.folder.findUnique({
    where: { id: folderId }
  });
  
  if (!folder) {
    const error = new Error('Folder not found');
    error.status = 404;
    throw error;
  }
  
  if (folder.userId !== userId) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
  
  return folder;
};

module.exports = { attachUser, requireAuth, verifyFolderOwnership };