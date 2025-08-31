import { Express, Request, Response } from "express";
import multer from "multer";
import cloudinary from "./cloudinary";
import { requireAuth } from "./supabase-auth";
import { supabaseStorage } from "./supabase-storage";
import { secureFileUpload, handleValidationErrors } from "./security-middleware";
import { body } from "express-validator";

// Configure multer for memory storage (files will be uploaded to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for faster processing
    fieldSize: 25 * 1024 * 1024, // 25MB field size
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Optimized helper function to upload file to Cloudinary with speed improvements
const uploadToCloudinary = async (
  fileBuffer: Buffer,
  options: {
    folder: string;
    resource_type?: 'image' | 'raw' | 'video' | 'auto';
    public_id?: string;
    format?: string;
    quality?: string;
    transformation?: any[];
  }
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder,
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id,
      format: options.format,
      // Speed optimizations
      chunk_size: 6000000, // 6MB chunks for faster upload
      timeout: 120000, // 2 minute timeout
      use_filename: false, // Skip filename processing
      unique_filename: true,
    };

    // Add image-specific optimizations
    if (options.resource_type === 'image' || !options.resource_type) {
      uploadOptions.quality = options.quality || 'auto:good';
      uploadOptions.fetch_format = 'auto';
      uploadOptions.flags = 'progressive'; // Progressive JPEG for faster loading
      if (options.transformation) {
        uploadOptions.transformation = options.transformation;
      }
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

// Export upload middleware and helper function for use in other routes
export { upload, uploadToCloudinary };

export function registerUploadRoutes(app: Express) {
  
  // Upload user avatar
  app.post("/api/upload/avatar", 
    requireAuth, 
    upload.single('avatar'), 
    secureFileUpload,
    [
      body('userId').optional().isUUID().withMessage('Invalid user ID format')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;
      
      // Upload to Cloudinary with optimizations
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novelnexus/avatars',
        public_id: `avatar_${userId}`,
        resource_type: 'image',
        quality: 'auto:good',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
      });

      // Update user profile with new avatar URL
      await supabaseStorage.updateUser(userId, {
        avatar_url: result.secure_url
      });

      res.json({
        message: "Avatar uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Upload story cover image
  app.post("/api/upload/story-cover", 
    requireAuth, 
    upload.single('cover'), 
    secureFileUpload,
    [
      body('storyId').optional().isUUID().withMessage('Invalid story ID format')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;
      const storyId = req.body.storyId;
      
      // Upload to Cloudinary with optimizations
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novelnexus/story-covers',
        public_id: `cover_${storyId || Date.now()}`,
        resource_type: 'image',
        quality: 'auto:good',
        transformation: [{ width: 800, height: 1200, crop: 'fill' }]
      });

      res.json({
        message: "Story cover uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      console.error('Story cover upload error:', error);
      res.status(500).json({ message: "Failed to upload story cover" });
    }
  });

  // Upload story poster image
  app.post("/api/upload/story-poster", requireAuth, upload.single('poster'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;
      const storyId = req.body.storyId;
      
      // Upload to Cloudinary with optimizations
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novelnexus/story-posters',
        public_id: `poster_${storyId || Date.now()}`,
        resource_type: 'image',
        quality: 'auto:good',
        transformation: [{ width: 1200, height: 800, crop: 'fill' }]
      });

      res.json({
        message: "Story poster uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id
      });
    } catch (error) {
      console.error('Story poster upload error:', error);
      res.status(500).json({ message: "Failed to upload story poster" });
    }
  });

  // Upload PDF story
  app.post("/api/upload/story-pdf", requireAuth, upload.single('pdf'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      const userId = req.user!.id;
      const storyId = req.body.storyId;
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novelnexus/story-pdfs',
        public_id: `pdf_${storyId || Date.now()}`,
        resource_type: 'raw'
      });

      res.json({
        message: "PDF story uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id,
        pages: result.pages || 0,
        format: result.format
      });
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ message: "Failed to upload PDF story" });
    }
  });

  // Upload multiple story images/photos
  app.post("/api/upload/story-images", requireAuth, upload.array('images', 10), async (req: Request, res: Response) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const userId = req.user!.id;
      const storyId = req.body.storyId;
      
      // Upload all images to Cloudinary with parallel processing
      const uploadPromises = req.files.map((file, index) => 
        uploadToCloudinary(file.buffer, {
          folder: 'novelnexus/story-images',
          public_id: `story_${storyId || Date.now()}_${index}`,
          resource_type: 'image',
          quality: 'auto:good',
          transformation: [{ width: 1200, height: 800, crop: 'limit' }]
        })
      );

      const results = await Promise.all(uploadPromises);
      
      const imageUrls = results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      }));

      res.json({
        message: "Story images uploaded successfully",
        images: imageUrls
      });
    } catch (error) {
      console.error('Story images upload error:', error);
      res.status(500).json({ message: "Failed to upload story images" });
    }
  });

  // Upload audio file
  app.post("/api/upload/audio", requireAuth, upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;

      // Accept common audio mime types
      const allowed = ['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/aac','audio/flac','audio/ogg'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Unsupported audio type" });
      }

      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'novelnexus/audio',
        public_id: `audio_${userId}_${Date.now()}`,
        resource_type: 'video' // Cloudinary treats audio under video resource type
      });

      res.json({
        message: "Audio uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id,
        duration: result.duration,
        format: result.format
      });
    } catch (error) {
      console.error('Audio upload error:', error);
      res.status(500).json({ message: "Failed to upload audio" });
    }
  });

  // Upload general file (documents, etc.)
  // No rate limiting for comic/story editor uploads
  app.post("/api/upload/file",
    requireAuth, 
    upload.single('file'),
    secureFileUpload,
    [
      body('folder')
        .optional()
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid folder name')
    ],
    handleValidationErrors,
    async (req: Request, res: Response) => {
    try {
      console.log('Upload request received:', {
        hasFile: !!req.file,
        fileSize: req.file?.size,
        fileName: req.file?.originalname,
        mimeType: req.file?.mimetype,
        folder: req.body.folder,
        userId: req.user?.id
      });

      if (!req.file) {
        console.error('No file provided in upload request');
        return res.status(400).json({ message: "No file provided" });
      }

      const userId = req.user!.id;
      const folder = req.body.folder || 'general';
      
      console.log('Attempting Cloudinary upload:', {
        folder: `novelnexus/${folder}`,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      });

      // Upload to Cloudinary with optimizations
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: `novelnexus/${folder}`,
        public_id: `file_${userId}_${Date.now()}`,
        resource_type: 'raw'
      });

      console.log('Cloudinary upload successful:', {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      });

      res.json({
        message: "File uploaded successfully",
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    } catch (error) {
      console.error('File upload error details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        folder: req.body?.folder,
        hasFile: !!req.file
      });
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Delete file from Cloudinary
  app.delete("/api/upload/:publicId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { publicId } = req.params;
      const resourceType = req.query.type as string || 'image';
      
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as any
      });

      if (result.result === 'ok') {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(404).json({ message: "File not found or already deleted" });
      }
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Get upload signature for direct frontend uploads
  app.post("/api/upload/signature", requireAuth, async (req: Request, res: Response) => {
    try {
      const { folder, public_id } = req.body;
      const timestamp = Math.round(Date.now() / 1000);
      
      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder: folder || 'novelnexus/general',
          public_id
        },
        process.env.CLOUDINARY_API_SECRET as string
      );

      res.json({
        signature,
        timestamp,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY
      });
    } catch (error) {
      console.error('Signature generation error:', error);
      res.status(500).json({ message: "Failed to generate upload signature" });
    }
  });
}
