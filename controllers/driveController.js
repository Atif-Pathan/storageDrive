// controllers/driveController.js
const fs = require('fs').promises;
const prismaClient = require("../config/prismaClient");
const { body, validationResult } = require('express-validator');
const cloudinary = require('../config/cloudinary');
const https = require('https');
const { verifyFolderOwnership } = require('../middleware/authRelated');

const validateFolder = [
  body('folderName')
    .trim()
    .notEmpty()
    .withMessage('FolderName is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('FolderName must be 1–50 characters')
    .matches(/^[a-zA-Z0-9_\s-]+$/)
    .withMessage('FolderName can only contain letters, numbers, hyphens, and underscores'),
];

// GET my drive - for authenticated users only
exports.getDrive = async (req, res, next) => {
  try {
    // folder id is null for root, else its the folder id in the route
    const folderId = req.params.id ? parseInt(req.params.id) : null;
    let currentFolder = null;
    let breadcrumbs = [{ id: null, name: 'My Drive', path: '/mydrive' }];
    
    // If viewing a specific folder
    if (folderId) {
      // Fetch folder with parent chain
      currentFolder = await prismaClient.folder.findUnique({
        where: { id: folderId }
      });
      
      // verify ownership
      await verifyFolderOwnership(folderId, req.user.id);

      // Build breadcrumbs
      breadcrumbs = [{id: folderId, name: currentFolder.name, path: `/mydrive/folders/${folderId}`}] // current folder added
      let currentParentId = currentFolder.parentId;
      while (currentParentId !== null) {
        const parentFolder = await prismaClient.folder.findUnique({
          where: { id: currentParentId }
        });
        breadcrumbs.push({id: currentParentId, name: parentFolder.name, path: `/mydrive/folders/${currentParentId}`})
        currentParentId = parentFolder.parentId;
      }
      breadcrumbs.push({ id: null, name: 'My Drive', path: '/mydrive' })
      breadcrumbs.reverse();
    }
    
    // Fetch folders (children of current folder)
    const folders = await prismaClient.folder.findMany({
      where: {
        userId: req.user.id,
        parentId: folderId
      },
      include: { _count: { select: { files: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    // Fetch files (in current folder)
    const files = await prismaClient.file.findMany({
      where: {
        userId: req.user.id,
        folderId: folderId
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.render('myDrive/drive', {
      user: req.user,
      currentFolder,
      breadcrumbs,
      folders,
      files,
      error: req.query.error || null,
      success: req.query.success || null
    });
    
  } catch (error) {
    next(error);
  }
};

exports.postUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.redirect('/mydrive?error=Please select a file to upload');
    }

    const { originalname, filename, mimetype, size, path } = req.file;
    const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

    if (folderId) {
      const folder = await prismaClient.folder.findUnique({
        where: { id: folderId }
      });
      
      if (!folder || folder.userId !== req.user.id) {
        // Clean up file before returning
        await fs.unlink(path).catch(() => {});
        return res.redirect('/mydrive?error=Folder not found or access denied');
      }
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(path, {
      resource_type: 'auto',
    });

    // Clean up local file immediately after successful upload
    await fs.unlink(path).catch(err => {
      console.error('Failed to delete local file:', err);
    });

    let finalFilename = originalname;
    const existingFile = await prismaClient.file.findFirst({
      where: {
        name: originalname,
        userId: req.user.id,
        folderId: folderId
      }
    });

    if (existingFile) {
      // Extract name and extension
      const lastDotIndex = originalname.lastIndexOf('.');
      const nameWithoutExt = lastDotIndex > 0 ? originalname.substring(0, lastDotIndex) : originalname;
      const ext = lastDotIndex > 0 ? originalname.substring(lastDotIndex) : '';
      
      // Append timestamp
      finalFilename = `${nameWithoutExt} (${Date.now()})${ext}`;
    }

    // Save to database
    await prismaClient.file.create({
      data: {
        name: finalFilename,
        filename: filename,
        mimeType: mimetype,
        size: size,
        url: uploadResult.secure_url,
        userId: req.user.id,
        publicId: uploadResult.public_id,
        folderId: folderId,
      }
    });

    const redirectUrl = folderId 
      ? `/mydrive/folders/${folderId}?success=File uploaded successfully`
      : '/mydrive?success=File uploaded successfully';
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    // If we have a file path, try to clean it up
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error); // Pass to error handler instead of redirect
  }
}

exports.postCreateFolder = [
  ...validateFolder,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      const { folderName } = req.body;
      const parentId = req.body.parentId ? parseInt(req.body.parentId) : null;

      if (!errors.isEmpty()) {
        return res.redirect('/mydrive?error=Failed to create folder'); 
      }

      if (parentId) {
        const parentFolder = await prismaClient.folder.findUnique({
          where: { id: parentId }
        });
        // verify ownership
        await verifyFolderOwnership(parentId, req.user.id);
      }

      const existingFolder = await prismaClient.folder.findFirst({
        where: {
          name: folderName,
          userId: req.user.id,
          parentId: parentId
        }
      });

      if (existingFolder) {
        return res.redirect('/mydrive?error=Folder already exists');
      }

      await prismaClient.folder.create({
        data: {
          name: folderName,
          userId: req.user.id,
          parentId: parentId,
        }
      });

      res.redirect(parentId ? `/mydrive/folders/${parentId}?success=Folder created` : '/mydrive?success=Folder created');
    } catch (error) {
        res.redirect('/mydrive?error=Failed to create folder');
    }
  }
]

exports.deleteFolder = async (req, res, next) => {
  try {
    const folderId = req.params.id ? parseInt(req.params.id) : null;
    const folder = await prismaClient.folder.findUnique({
        where: { id: folderId }
      });

    // verify ownership
    await verifyFolderOwnership(folderId, req.user.id);

    const parentId = folder.parentId

    await prismaClient.folder.delete({
      where: { id: folderId }
    })

    res.redirect(parentId ? `/mydrive/folders/${parentId}?success=Folder deleted` : '/mydrive?success=Folder deleted');
  } catch (error) {
    res.redirect('/mydrive?error=Failed to delete folder');
  }
}

exports.downloadFile = async(req, res, next) => {
  try {
    const fileId = req.params.id ? parseInt(req.params.id) : null;
    const file = await prismaClient.file.findUnique({
      where: {id: fileId}
    })
    if (!file) {
      return res.status(404).render('error', { 
        message: 'File does not exist',
        error: {} 
      });
    }
    if (file.userId !== req.user.id) {
      return res.status(403).render('error', { 
        message: 'Access denied - You do not own this folder',
        error: {} 
      });
    }

    // download now
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Type', file.mimeType);

    // Stream from Cloudinary to client
    https.get(file.url, (stream) => {
      stream.pipe(res);
    }).on('error', (err) => {
      console.error('Download error:', err);
      res.status(500).send('Download failed');
    });
  } catch (error) {
    res.redirect('/mydrive?error=Failed to download file');
  }
}

exports.deleteFile = async(req, res, next) => {
  try {
    const fileId = req.params.id ? parseInt(req.params.id) : null;
    const file = await prismaClient.file.findUnique({
      where: {id: fileId}
    })
    if (!file) {
      return res.status(404).render('error', { 
        message: 'File does not exist',
        error: {} 
      });
    }
    if (file.userId !== req.user.id) {
      return res.status(403).render('error', { 
        message: 'Access denied - You do not own this file',
        error: {} 
      });
    }

    // Delete from Cloudinary first
    try {
      await cloudinary.uploader.destroy(file.publicId);
    } catch (cloudinaryError) {
      console.log('Failed to delete from Cloudinary:', cloudinaryError);
      // Continue - delete from DB anyway
    }
    // delete from db
    await prismaClient.file.delete({
      where: { id: fileId }
    })

    res.redirect(file.folderId ? `/mydrive/folders/${file.folderId}?success=File deleted` : '/mydrive?success=File deleted');
  } catch (error) {
    res.redirect('/mydrive?error=Failed to delete file');
  }
}