// controllers/driveController.js
// const prismaClient = require('../config/prismaClient');

// GET my drive - for authenticated users only
exports.getMyDrive = (req, res) => {
  res.render('myDrive/home', {
    user: req.user
  });
};
