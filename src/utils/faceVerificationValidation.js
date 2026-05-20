// ──────────────────────────────────────────────────────────────────────────────
// Face Verification Validation Utilities
// e-Samadhan AI - Mandatory Live Face Capture System
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Validates if an image file is valid for face verification
 * @param {File|Blob} file - Image file to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validateFaceImage = (file) => {
      // Check file exists
      if (!file) {
            return { valid: false, error: 'No image selected' };
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
            return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
            return { valid: false, error: 'Image size must be less than 5MB' };
      }

      // Check minimum file size (at least 10KB)
      const minSize = 10 * 1024; // 10KB
      if (file.size < minSize) {
            return { valid: false, error: 'Image is too small or empty' };
      }

      return { valid: true, error: null };
};

/**
 * Validates if base64 image is valid
 * @param {string} base64String - Base64 encoded image
 * @returns {Object} { valid: boolean, error: string|null }
 */
export const validateBase64Image = (base64String) => {
      if (!base64String) {
            return { valid: false, error: 'No image captured' };
      }

      // Check base64 format
      const base64Regex = /^data:image\/(jpeg|png|jpg|webp);base64,/;
      if (!base64Regex.test(base64String)) {
            return { valid: false, error: 'Invalid image format' };
      }

      // Rough size check (base64 is ~33% larger than original)
      const sizeInKB = (base64String.length / 1024);
      if (sizeInKB > (5 * 1024)) {
            return { valid: false, error: 'Image is too large' };
      }

      return { valid: true, error: null };
};

/**
 * Checks if camera is available on device
 * @returns {Promise<boolean>}
 */
export const isCameraAvailable = async () => {
      try {
            const constraints = { video: true };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            // Stop all tracks immediately
            stream.getTracks().forEach(track => track.stop());
            return true;
      } catch (err) {
            return false;
      }
};

/**
 * Requests camera permission
 * @returns {Promise<PermissionStatus>}
 */
export const requestCameraPermission = async () => {
      try {
            const permission = await navigator.permissions.query({ name: 'camera' });
            return permission;
      } catch (err) {
            console.error('Permission query failed:', err);
            return null;
      }
};

/**
 * Gets current camera permission status
 * @returns {Promise<string>} 'granted' | 'denied' | 'prompt' | null
 */
export const getCameraPermissionStatus = async () => {
      try {
            if (!navigator.permissions) {
                  return null;
            }
            const permission = await navigator.permissions.query({ name: 'camera' });
            return permission.state;
      } catch (err) {
            return null;
      }
};

/**
 * Validates entire face capture registration data
 * @param {Object} data - Registration data
 * @returns {Object} { valid: boolean, errors: Object }
 */
export const validateFaceVerificationStep = (data) => {
      const errors = {};

      // Check if image captured
      if (!data.liveImage) {
            errors.liveImage = 'Please capture a photo';
      } else {
            const imageValidation = validateBase64Image(data.liveImage);
            if (!imageValidation.valid) {
                  errors.liveImage = imageValidation.error;
            }
      }

      // Check if image confirmed
      if (!data.imageConfirmed) {
            errors.imageConfirmed = 'Please confirm your photo';
      }

      return {
            valid: Object.keys(errors).length === 0,
            errors
      };
};

/**
 * Formats error message for user display
 * @param {string} errorCode - Error code from camera API
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (errorCode) => {
      const errorMessages = {
            'NotAllowedError': 'Camera permission denied. Please allow camera access in your browser settings.',
            'PermissionDeniedError': 'Camera permission denied. Please allow camera access.',
            'NotFoundError': 'No camera found on your device.',
            'NotReadableError': 'Camera is already in use. Please close other apps using the camera.',
            'OverconstrainedError': 'Camera specifications not supported by your device.',
            'TypeError': 'Camera configuration error. Please try again.',
            'CAMERA_UNAVAILABLE': 'Camera is not available. Please check your device.',
            'PERMISSION_DENIED': 'You denied camera access. Please grant permission to continue.',
            'UNKNOWN': 'An unknown error occurred. Please try again.'
      };

      return errorMessages[errorCode] || errorMessages['UNKNOWN'];
};

/**
 * Checks if image dimensions are reasonable for face capture
 * @param {HTMLImageElement|Blob} image - Image to check
 * @returns {Promise<boolean>}
 */
export const validateImageDimensions = (image) => {
      return new Promise((resolve) => {
            if (image instanceof File || image instanceof Blob) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                              // Minimum 320x240, Maximum 4096x4096
                              const valid = img.width >= 320 && img.height >= 240 &&
                                    img.width <= 4096 && img.height <= 4096;
                              resolve(valid);
                        };
                        img.src = e.target.result;
                  };
                  reader.readAsDataURL(image);
            } else {
                  resolve(true);
            }
      });
};

/**
 * Generates file name for captured image
 * @param {string} userId - User ID
 * @param {string} timestamp - Timestamp (optional)
 * @returns {string} Generated filename
 */
export const generateImageFilename = (userId, timestamp = null) => {
      const ts = timestamp || Date.now();
      const random = Math.random().toString(36).substring(7);
      return `selfie-${userId}-${ts}-${random}.jpg`;
};

/**
 * Converts base64 to Blob for FormData
 * @param {string} base64String - Base64 encoded image
 * @param {string} filename - Filename
 * @returns {Blob}
 */
export const base64ToBlob = (base64String, filename = 'image.jpg') => {
      const parts = base64String.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const bstr = atob(parts[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
      }

      return new Blob([u8arr], { type: contentType });
};

/**
 * Compresses image for better performance
 * @param {string} base64String - Base64 encoded image
 * @param {number} quality - Quality 0-1 (default 0.8)
 * @returns {Promise<string>} Compressed base64 string
 */
export const compressImage = (base64String, quality = 0.8) => {
      return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  // Set canvas dimensions
                  canvas.width = img.width;
                  canvas.height = img.height;

                  // Draw and compress
                  ctx.drawImage(img, 0, 0);
                  const compressed = canvas.toDataURL('image/jpeg', quality);
                  resolve(compressed);
            };
            img.src = base64String;
      });
};

/**
 * Frontend validation before sending to backend
 * @param {Object} signupData - Full signup form data
 * @returns {Object} { canSubmit: boolean, blockingErrors: string[] }
 */
export const validateSignupBeforeSubmit = (signupData) => {
      const blockingErrors = [];

      // Check mandatory face verification
      if (!signupData.liveImage) {
            blockingErrors.push('Live face capture is mandatory');
      }
      if (!signupData.imageConfirmed) {
            blockingErrors.push('Please confirm your captured face photo');
      }

      // Check mandatory personal info
      if (!signupData.name) blockingErrors.push('Name is required');
      if (!signupData.email) blockingErrors.push('Email is required');
      if (!signupData.phone) blockingErrors.push('Phone number is required');
      if (!signupData.password) blockingErrors.push('Password is required');

      // Check mandatory location info
      if (!signupData.address) blockingErrors.push('Address is required');
      if (!signupData.city) blockingErrors.push('City is required');
      if (!signupData.state) blockingErrors.push('State is required');

      // Check mandatory government ID
      if (!signupData.govtIdNumber) blockingErrors.push('Government ID number is required');

      return {
            canSubmit: blockingErrors.length === 0,
            blockingErrors
      };
};

/**
 * Constants for face verification
 */
export const FACE_VERIFICATION_CONSTANTS = {
      // Supported image formats
      SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],

      // Size limits
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      MIN_FILE_SIZE: 10 * 1024, // 10KB

      // Image dimensions
      MIN_WIDTH: 320,
      MIN_HEIGHT: 240,
      MAX_WIDTH: 4096,
      MAX_HEIGHT: 4096,

      // Capture specifications
      IDEAL_WIDTH: 1280,
      IDEAL_HEIGHT: 720,
      CAPTURE_WIDTH: 640,
      CAPTURE_HEIGHT: 480,

      // Compression quality (0-1)
      COMPRESSION_QUALITY: 0.8,

      // Camera facing mode
      FACING_MODE: 'user', // Front camera for selfie

      // Timeout in ms
      CAMERA_REQUEST_TIMEOUT: 15000,
};

export default {
      validateFaceImage,
      validateBase64Image,
      isCameraAvailable,
      requestCameraPermission,
      getCameraPermissionStatus,
      validateFaceVerificationStep,
      getErrorMessage,
      validateImageDimensions,
      generateImageFilename,
      base64ToBlob,
      compressImage,
      validateSignupBeforeSubmit,
      FACE_VERIFICATION_CONSTANTS
};
