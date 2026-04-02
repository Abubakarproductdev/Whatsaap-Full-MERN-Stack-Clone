const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

// Allow both images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max (videos can be larger)
  },
});

/**
 * Upload buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer.
 * @param {string} folder - Cloudinary folder name.
 * @returns {Promise<object>} - Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, folder = 'profile_pictures') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto', // Auto-detect image or video
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };