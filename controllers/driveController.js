// controllers/driveController.js
const prismaClient = require("../config/prismaClient");

// GET my drive - for authenticated users only
exports.getMyDrive = async (req, res) => {
  try {
    const files = await prismaClient.file.findMany({
      where: {
        userId: req.user.id,
        folderId: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.render('myDrive/home', {
      user: req.user,
      files: files // Pass files to template
    });
  } catch (error) {
    res.render('myDrive/home', {
      user: req.user,
      files: [],
      error: 'Failed to load files'
    });
  }
};

exports.postUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.redirect('/mydrive?error=Please select a file to upload');
    }

    const { originalname, filename, mimetype, size, path } = req.file;

    await prismaClient.file.create({
      data: {
        name: originalname,
        filename: filename,
        mimeType: mimetype,
        size: size,
        url: path,
        userId: req.user.id,
        folderId: null
      }
    });

    res.redirect('/mydrive?success=File uploaded successfully');
  } catch (error) {
    res.redirect('/mydrive?error=Failed to upload file');
  }
}
