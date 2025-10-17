// routes/driveRoutes.js
const { Router } = require('express');
const driveController = require('../controllers/driveController');
const { requireAuth } = require('../middleware/authRelated');
const driveRouter = Router();
const upload = require('../config/multer')

driveRouter.get('/', requireAuth, driveController.getMyDrive);
// driveRouter.post('/signup', driveController.postSignUp);

driveRouter.post('/upload', requireAuth, upload.single('file'), driveController.postUpload);

module.exports = driveRouter;