const { Router } = require('express');
const publicController = require('../controllers/publicController');
const publicRouter = Router();

// View shared folder (top level)
// GET /share/:shareId
publicRouter.get('/share/:shareId', publicController.getSharedFolder);

// View subfolder within a shared folder (nested navigation)
// GET /share/:shareId/folders/:folderId
publicRouter.get('/share/:shareId/folders/:folderId', publicController.getSharedSubfolder);

// Download file from shared folder
// GET /share/:shareId/files/:fileId/download
publicRouter.get('/share/:shareId/files/:fileId/download', publicController.downloadSharedFile);

module.exports = publicRouter;