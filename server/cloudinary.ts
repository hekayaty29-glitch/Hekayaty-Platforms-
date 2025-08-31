import { v2 as cloudinary } from 'cloudinary';

// Load Cloudinary credentials from environment variables.
// Configure these in your deployment platform or in a local .env file (root directory):
//   CLOUDINARY_CLOUD_NAME=<your-cloud-name>
//   CLOUDINARY_API_KEY=<your-api-key>
//   CLOUDINARY_API_SECRET=<your-api-secret>

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Convenience wrapper for signed uploads if you need them in future.
export const getUploadSignature = (params: { folder?: string; public_id?: string; [key: string]: any } = {}) => {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, ...params },
    process.env.CLOUDINARY_API_SECRET as string,
  );
  return { timestamp, signature };
};

export default cloudinary;
