// routes/driveRoutes.js
const { Router } = require('express');
const driveController = require('../controllers/driveController');
const { requireAuth } = require('../middleware/authRelated');
const driveRouter = Router();
const upload = require('../config/multer')

// Root view
driveRouter.get('/', requireAuth, driveController.getDrive);                                                    // READ

// Folder view
driveRouter.get('/folders/:id', requireAuth, driveController.getDrive);                                         // READ

// Actions
driveRouter.post('/folders/create', requireAuth, driveController.postCreateFolder);                             // CREATE
driveRouter.post('/folders/:id/delete', requireAuth, driveController.deleteFolder);       // DELETE   
driveRouter.post('/upload', requireAuth, upload.single('file'), driveController.postUpload);                    // CREATE - file
driveRouter.get('/files/:id/download', requireAuth, driveController.downloadFile);                              // download - file
driveRouter.post('/files/:id/delete', requireAuth, driveController.deleteFile);                             // delete - file

module.exports = driveRouter;