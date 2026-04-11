// User Controller - handles user business logic
const { UserRepository } = require('../data/repositories/user-repository');
const { UserUseCases } = require('../domain/services/user-usecases');

// Initialize use cases
const userRepository = new UserRepository();
const userUseCases = new UserUseCases(userRepository);

module.exports = {
  // GET /api/v1/users/me - Get current user profile (protected)
  async getCurrentUser(req, res) {
    try {
      const userId = req.user?.id;
      const provider = req.user?.provider;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - No user ID in token' });
      }

      console.log('GetCurrentUser - Looking up user by ID:', userId, 'provider:', provider);

      let user = null;

      // Try different lookup strategies based on provider
      if (provider === 'firebase') {
        // Firebase users: lookup by firebase_uid
        user = await userUseCases.getUserByFirebaseUid(userId);
      } else if (provider === 'supertokens') {
        // SuperTokens users: lookup by supertokens_uid
        user = await userRepository.findBySuperTokensUid(userId);
      }

      // Fallback: try direct ID lookup
      if (!user) {
        user = await userUseCases.getUserById(userId);
      }

      if (!user) {
        console.log('User not found in database for ID:', userId);
        return res.status(404).json({ error: 'User not found. Please sync user first.' });
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const userProto = {
          ...user,
          id: user.id,
          firebaseUid: user.firebaseUid || '',
          email: user.email,
          username: user.username || '',
          displayName: user.displayName || '',
          photoUrl: user.photoUrl || '',
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          userRole: user.userRole,
          accountStatus: user.accountStatus,
          preferencesCompleted: user.preferencesCompleted,
          fcmToken: user.fcmToken || '',
          timezone: user.timezone || '',
          language: user.language,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || '',
        };

        res.proto(userProto, 'resilio.user.User');
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PUT /api/v1/users/me - Update current user profile (protected)
  async updateCurrentUser(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { displayName, photoUrl, username, language, availabilityJson, timezone } = req.body;

      // Update users table
      const updated = await userRepository.update(userId, {
        displayName,
        photoUrl,
        username,
        language,
        timezone,
      });

      // If availability is provided, attempt to update therapist_profiles
      if (availabilityJson && req.user?.role === 'therapist') {
        const { TherapistRepository } = require('../data/repositories/therapist-repository');
        const therapistRepo = new TherapistRepository();
        await therapistRepo.updateProfileByUserId(userId, { availability_json: availabilityJson });
      }

      res.json({ user: updated });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // DELETE /api/v1/users/me - Delete current user (protected)
  async deleteCurrentUser(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // TODO: Implement soft delete or account deletion logic
      res.json({ message: 'Delete endpoint ready - not implemented yet' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/users/:id - Get user by ID (protected)
  async getUserById(req, res) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userUseCases.getUserById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const userProto = {
          ...user,
          id: user.id,
          firebaseUid: user.firebaseUid || '',
          email: user.email,
          username: user.username || '',
          displayName: user.displayName || '',
          photoUrl: user.photoUrl || '',
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          userRole: user.userRole,
          accountStatus: user.accountStatus,
          preferencesCompleted: user.preferencesCompleted,
          fcmToken: user.fcmToken || '',
          timezone: user.timezone || '',
          language: user.language,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || '',
        };

        res.proto(userProto, 'resilio.user.User');
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/users - List all users (protected, admin only)
  async listUsers(req, res) {
    try {
      // TODO: Implement pagination and filtering
      // For now, return empty array as this endpoint is not used by frontend
      res.json({ users: [], total: 0 });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async syncUser(req, res) {
    try {
      const { firebaseUid, email, displayName, photoUrl, userRole, fcmToken } = req.body;

      const user = await userUseCases.syncUser({
        firebaseUid,
        email,
        displayName,
        photoUrl,
        userRole: userRole,
        fcmToken: fcmToken
      });

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const userProto = {
          ...user,
          id: user.id,
          firebaseUid: user.firebaseUid || '',
          email: user.email,
          username: user.username || '',
          displayName: user.displayName || '',
          photoUrl: user.photoUrl || '',
          phoneNumber: user.phoneNumber || '',
          dateOfBirth: user.dateOfBirth || '',
          gender: user.gender || '',
          userRole: user.userRole,
          accountStatus: user.accountStatus,
          preferencesCompleted: user.preferencesCompleted,
          fcmToken: user.fcmToken || '',
          timezone: user.timezone || '',
          language: user.language,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString() || '',
        };

        res.proto(userProto, 'resilio.user.User');
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error('Sync user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // PUT /api/v1/users/me/fcm-token — Update the device FCM push token
  async updateFcmToken(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { fcm_token } = req.body;
      if (!fcm_token) return res.status(400).json({ error: 'fcm_token is required' });

      const updated = await userRepository.update(userId, { fcmToken: fcm_token });
      res.json({ success: true, fcmToken: updated.fcmToken });
    } catch (error) {
      console.error('updateFcmToken error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};