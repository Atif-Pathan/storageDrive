// controllers/driveController.js
const prismaClient = require("../config/prismaClient");
const { body, validationResult } = require('express-validator');

const validateFolder = [
  body('folderName')
    .trim()
    .notEmpty()
    .withMessage('FolderName is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('FolderName must be 1–50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('FolderName can only contain letters, numbers, hyphens, and underscores'),
];

// GET my drive - for authenticated users only
exports.getMyDrive = async (req, res) => {
  try {
    const folders = await prismaClient.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: null
      },
      include: {
        _count: { 
          select: { 
            files: true 
          } 
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
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
      files: files, // Pass files to template
      folders: folders
    });
  } catch (error) {
    res.render('myDrive/home', {
      user: req.user,
      files: [],
      folders: [],
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

exports.postCreateFolder = [
  ...validateFolder,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      const { folderName } = req.body;

      if (!errors.isEmpty()) {
        res.redirect('/mydrive?error=Failed to upload file');
      }

      const existingFolder = await prismaClient.folder.findUnique({
        where: {
          name_userId_parentId: {
            name: folderName,
            userId: req.user.id,
            parentId: null, // For a root-level folder
          },
        }
      })

      if (existingFolder) {
        res.redirect('/mydrive?error=Folder already exists');
      }

      await prismaClient.folder.create({
        data: {
          name: folderName,
          userId: req.user.id,
          parentId: null,
        }
      });

      res.redirect('/mydrive?success=Folder created');
    } catch (error) {
        res.redirect('/mydrive?error=Failed to create folder');
    }
  }
]