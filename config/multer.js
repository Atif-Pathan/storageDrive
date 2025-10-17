// config/multer.js
const multer  = require('multer')

const getFileExtension = (filename) => {
  const parts = filename.split('.');
  if (parts.length > 1) { // Ensure there is an extension
    return parts.pop();
  }
  return ''; // No extension found
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = getFileExtension(file.originalname);
    cb(null, uniqueSuffix + '.' + ext)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'text/plain',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false); // Reject the file
  }
}

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
})

module.exports = upload;