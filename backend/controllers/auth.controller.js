const User = require('../models/User');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation');

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  };
}






// ================================
// UPDATE PROFILE
// ================================

/**
 * Update user profile — only updates fields that are provided.
 * Accepts: username, about (in body), profilePicture (as file upload).
 * Requires authentication.
 */
exports.updateProfile = async (req, res) => {
  const { username, about } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let isUpdated = false;

    // ---- Update Username (if provided) ----
    if (username) {
      const trimmedUsername = username.trim();

      if (trimmedUsername !== user.username) {
        user.username = trimmedUsername;
        isUpdated = true;
      }
    }






    // ---- Update About (if provided) ----
    if (about !== undefined && about.trim() !== user.about) {
      user.about = about.trim();
      isUpdated = true;
    }

    // ---- Update Profile Picture (if file uploaded) ----
    if (req.file) {
      // Delete old picture from Cloudinary if exists
      if (user.profilePicture) {
        await deleteOldImage(user.profilePicture);
      }

      // Upload new picture to Cloudinary from buffer
      const result = await uploadToCloudinary(req.file.buffer);
      user.profilePicture = result.secure_url;
      isUpdated = true;
    }

    if (!isUpdated) {
      return res.status(200).json({
        success: true,
        message: 'Nothing to update',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};





// ================================
// GET OUR PROFILE
// ================================

exports.getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: formatUserResponse(req.user),
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};







// ================================
// GET ALL USERS CONVERSATION WITH LAST MESSAGE
// ================================
exports.getAllUsers = async (req, res) => {
  const loggedInUser = req.user._id;

  try {
    // Get all users except the logged-in user
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select('username profilePicture lastSeen isOnline about phoneNumber')
      .lean();

    // For each user, find their conversation with the logged-in user
    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user._id] },
        })
          .populate({
            path: 'lastMessage',
            select: 'content contentType sender receiver messageStatus createdAt',
          })
          .lean();

        return {
          ...user,
          conversation: conversation
            ? {
                conversationId: conversation._id,
                lastMessage: conversation.lastMessage || null,
                unreadCount: conversation.unreadCount,
                updatedAt: conversation.updatedAt,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      users: usersWithConversation,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
};






// ================================
// LOGOUT
// ================================

exports.logout = async (req, res) => {
  try {
    const cookieOptions = getCookieOptions();
    res.clearCookie('auth_token', cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: error.message,
    });
  }
};






// ================================
// HELPER FUNCTIONS
// ================================

function formatUserResponse(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    profilePicture: user.profilePicture || null,
    about: user.about,
    status: user.status,
    isOnline: user.isOnline,
    isVerified: user.isVerified,
    lastSeen: user.lastSeen,
  };
}





async function deleteOldImage(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const folderAndFile = parts.slice(-2).join('/');
    const publicId = folderAndFile.replace(/\.[^/.]+$/, '');

    await cloudinary.uploader.destroy(publicId);
    console.log('Old profile picture deleted:', publicId);
  } catch (error) {
    console.error('Failed to delete old image:', error);
  }
}
