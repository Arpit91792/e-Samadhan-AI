/**
 * Create JWT token, set HTTP-only cookie, and send response
 */
const sendToken = (user, statusCode, res, message = 'Success') => {
      const token = user.getSignedJwtToken();

      const cookieOptions = {
            expires: new Date(
                  Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,                                    // not accessible via JS
            secure: process.env.NODE_ENV === 'production',     // HTTPS only in prod
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      };

      // Remove sensitive fields from response
      const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            department: user.department,
            adminLevel: user.adminLevel,
            managedDepartment: user.managedDepartment,
            officerStatus: user.officerStatus,
            employeeId: user.employeeId,
            assignedArea: user.assignedArea,
            address: user.address,
            profileImage: user.profileImage,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
      };

      res
            .status(statusCode)
            .cookie('token', token, cookieOptions)
            .json({
                  success: true,
                  message,
                  token,           // also send in body for localStorage fallback
                  user: userResponse,
            });
};

export default sendToken;
