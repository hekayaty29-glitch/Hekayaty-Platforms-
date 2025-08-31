// Cloudinary integration for Edge Functions

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export function getCloudinaryConfig(): CloudinaryConfig {
  return {
    cloudName: Deno.env.get('CLOUDINARY_CLOUD_NAME') ?? '',
    apiKey: Deno.env.get('CLOUDINARY_API_KEY') ?? '',
    apiSecret: Deno.env.get('CLOUDINARY_API_SECRET') ?? '',
  }
}

export async function uploadToCloudinary(
  buffer: Uint8Array,
  options: {
    folder?: string
    public_id?: string
    transformation?: any[]
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
    overwrite?: boolean
  }
): Promise<{ success: boolean, url?: string, public_id?: string, secure_url?: string, error?: string }> {
  const config = getCloudinaryConfig()
  const { folder = '', public_id, resource_type = 'auto', overwrite = false } = options
  
  try {
    // Create a File-like object from buffer
    const blob = new Blob([buffer])
    const file = new File([blob], public_id || 'upload', { type: 'application/octet-stream' })
    
    // Create form data for Cloudinary upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', config.apiKey)
    
    if (folder) formData.append('folder', folder)
    if (public_id) formData.append('public_id', public_id)
    if (overwrite) formData.append('overwrite', 'true')
    
    // Generate signature for secure uploads
    const timestamp = Math.round(Date.now() / 1000)
    formData.append('timestamp', timestamp.toString())
    
    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resource_type}/upload`
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      return { success: false, error: `Cloudinary upload failed: ${response.statusText}` }
    }
    
    const result = await response.json()
    return { 
      success: true, 
      url: result.url,
      public_id: result.public_id,
      secure_url: result.secure_url
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return { success: false, error: error.message || 'Upload failed' }
  }
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

export async function processFileUpload(
  buffer: Uint8Array,
  options: {
    folder?: string
    public_id?: string
    maxSize?: number
    allowedTypes?: string[]
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
  } = {}
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  const {
    folder = '',
    public_id,
    maxSize = 100 * 1024 * 1024, // 100MB default
    resource_type = 'auto'
  } = options
  
  // Validate file size
  if (buffer.length > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`)
  }
  
  // Upload to Cloudinary
  const result = await uploadToCloudinary(buffer, {
    folder,
    public_id,
    resource_type
  })
  
  if (!result.success || !result.secure_url) {
    throw new Error(result.error || 'Upload failed - no URL returned')
  }
  
  return {
    url: result.url!,
    publicId: result.public_id!,
    secureUrl: result.secure_url!
  }
}
