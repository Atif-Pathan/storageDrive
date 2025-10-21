const prismaClient = require("../config/prismaClient");
const https = require('https');

// Helper: Check if targetFolderId is a descendant of ancestorFolderId
// Returns true if targetFolder is inside ancestorFolder (at any depth)
// Returns false if it's not, or if it's a parent/sibling
async function isDescendantFolder(targetFolderId, ancestorFolderId) {
  // Your implementation here
  // Pseudocode:
  // 1. Start with targetFolder
  // 2. Traverse up the parent chain (check parentId repeatedly)
  // 3. If we find ancestorFolderId in the chain, return true
  // 4. If we reach the top (parentId is null), return false
};

// Get shared folder - top level contents
exports.getSharedFolder = async (req, res, next) => {
  // View the original shared folder
  // Steps:
  // 1. Get shareId from params
  // 2. Find ShareLink (check not expired)
  // 3. Get the folder from shareLink.folder
  // 4. Get files in this folder
  // 5. Get subfolders in this folder
  // 6. Render sharedView with breadcrumbs showing just the shared folder
};

// Get subfolder within shared folder - nested navigation
exports.getSharedSubfolder = async (req, res, next) => {
  // View a subfolder within a shared folder
  // Steps:
  // 1. Get shareId and folderId from params
  // 2. Find ShareLink (check not expired)
  // 3. Get the target folder
  // 4. **CRITICAL**: Verify the target folder is a descendant of the shared folder
  //    - Use the helper function isDescendantFolder (see below)
  //    - If not a descendant, throw error "Access denied"
  // 5. Get files in this target folder
  // 6. Get subfolders in this target folder
  // 7. Build breadcrumbs showing path from shared folder to current folder
  // 8. Render sharedView with breadcrumbs
};

// Download file from shared folder (public)
exports.downloadSharedFile = async (req, res, next) => {
  // Download a file from shared folder
  // Steps:
  // 1. Get shareId and fileId from params
  // 2. Find ShareLink (check not expired)
  // 3. Find file
  // 4. Verify file belongs to this shared folder or its subfolders
  //    - Use isDescendantFolder to check if file's folder is within the share
  // 5. Stream download from Cloudinary
};

module.exports = exports;