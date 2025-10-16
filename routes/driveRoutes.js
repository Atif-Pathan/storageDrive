// routes/driveRoutes.js
const { Router } = require('express');
const driveController = require('../controllers/driveController');
const { requireAuth } = require('../middleware/authRelated');
const driveRouter = Router();

driveRouter.get('/', requireAuth, driveController.getMyDrive);
// driveRouter.post('/signup', driveController.postSignUp);

module.exports = driveRouter;