const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Server-side validation of uploaded face images.
 * Face matching runs in the browser via face-api.js.
 */
export const validateFaceUpload = async (req, res, next) => {
      try {
            const { documentImage, selfieImage } = req.files || {};

            if (!documentImage?.[0] || !selfieImage?.[0]) {
                  return res.status(400).json({
                        success: false,
                        message: 'Both document image and selfie are required.',
                        code: 'MISSING_FILES',
                  });
            }

            for (const file of [documentImage[0], selfieImage[0]]) {
                  if (!ALLOWED.includes(file.mimetype)) {
                        return res.status(400).json({
                              success: false,
                              message: 'Only JPEG, PNG, or WebP images are allowed.',
                              code: 'INVALID_TYPE',
                        });
                  }
                  if (file.size > MAX_SIZE) {
                        return res.status(400).json({
                              success: false,
                              message: 'Image must be under 5MB.',
                              code: 'FILE_TOO_LARGE',
                        });
                  }
                  if (file.size < 1024) {
                        return res.status(400).json({
                              success: false,
                              message: 'Image file appears empty or corrupted.',
                              code: 'INVALID_FILE',
                        });
                  }
            }

            res.status(200).json({
                  success: true,
                  message: 'Images validated. Proceed with client-side face matching.',
            });
      } catch (err) {
            next(err);
      }
};

export const faceHealth = (req, res) => {
      res.json({
            success: true,
            message: 'Face verification API is available',
            clientModelsPath: '/models',
      });
};
