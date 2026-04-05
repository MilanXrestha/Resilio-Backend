const { supabase } = require('../../config/supabase-client');

/**
 * User Repository - Handles database operations for users
 */
class UserRepository {
  /**
   * Find user by ID
   */
  async findById(userId) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.findById error:', error);
      return null;
    }
  }

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (error || !data) return null;

      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.findByFirebaseUid error:', error);
      return null;
    }
  }

  /**
   * Find user by SuperTokens UID
   */
  async findBySuperTokensUid(superTokensUid) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supertokens_uid', superTokensUid)
        .single();

      if (error || !data) return null;

      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.findBySuperTokensUid error:', error);
      return null;
    }
  }

  /**
   * Find user by email address
   */
  async findByEmail(email) {
    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error || !data) return null;
      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.findByEmail error:', error);
      return null;
    }
  }

  /**
   * Upsert a SuperTokens passwordless user by email.
   * Links the SuperTokens UID for future lookups.
   */
  async upsertByEmail({ email, displayName = '', superTokensUid = null }) {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Check if user already exists by email
      let existing = await this.findByEmail(email);

      // Also check by SuperTokens UID if provided and not found by email
      if (!existing && superTokensUid) {
        existing = await this.findBySuperTokensUid(superTokensUid);
      }

      if (existing) {
        const updatePayload = {
          last_login_at: new Date().toISOString(),
        };

        if (displayName) {
          updatePayload.display_name = displayName;
        }

        // Link SuperTokens UID if not already linked
        if (superTokensUid && !existing.superTokensUid) {
          updatePayload.supertokens_uid = superTokensUid;
        }

        const { data, error } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', existing.id)
          .select('*')
          .single();

        if (error) throw error;
        return this._mapToUser(data);
      }

      // Create new user
      const insertPayload = {
        email,
        display_name: displayName || email.split('@')[0],
        user_role: 'user',
        account_status: 'active',
        preferences_completed: false,
        language: 'en',
        last_login_at: new Date().toISOString(),
      };

      if (superTokensUid) {
        insertPayload.supertokens_uid = superTokensUid;
      }

      const { data, error } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;
      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.upsertByEmail error:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(userData) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return userData;
      }

      const insertPayload = {
        email: userData.email,
        display_name: userData.displayName,
        photo_url: userData.photoUrl,
        user_role: userData.userRole || 'user',
        account_status: userData.accountStatus || 'active',
        preferences_completed: userData.preferencesCompleted || false,
        language: userData.language || 'en',
      };

      if (userData.firebaseUid) {
        insertPayload.firebase_uid = userData.firebaseUid;
      }

      if (userData.superTokensUid) {
        insertPayload.supertokens_uid = userData.superTokensUid;
      }

      if (userData.fcmToken) {
        insertPayload.fcm_token = userData.fcmToken;
      }

      const { data, error } = await supabase
        .from('users')
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw error;

      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.create error:', error);
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async update(userId, updateData) {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return { id: userId, ...updateData };
      }

      const updatePayload = {};

      // Map all possible fields
      if (updateData.firebaseUid !== undefined) updatePayload.firebase_uid = updateData.firebaseUid;
      if (updateData.superTokensUid !== undefined) updatePayload.supertokens_uid = updateData.superTokensUid;
      if (updateData.displayName !== undefined) updatePayload.display_name = updateData.displayName;
      if (updateData.photoUrl !== undefined) updatePayload.photo_url = updateData.photoUrl;
      if (updateData.email !== undefined) updatePayload.email = updateData.email;
      if (updateData.preferencesCompleted !== undefined) updatePayload.preferences_completed = updateData.preferencesCompleted;
      if (updateData.fcmToken !== undefined) updatePayload.fcm_token = updateData.fcmToken;
      if (updateData.lastLoginAt) {
        updatePayload.last_login_at = updateData.lastLoginAt instanceof Date
          ? updateData.lastLoginAt.toISOString()
          : new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;

      return this._mapToUser(data);
    } catch (error) {
      console.error('UserRepository.update error:', error);
      throw error;
    }
  }

  /**
   * Map database row to user object
   * @private
   */
  _mapToUser(dbUser) {
    return {
      id: dbUser.id,
      firebaseUid: dbUser.firebase_uid,
      superTokensUid: dbUser.supertokens_uid,
      email: dbUser.email,
      username: dbUser.username,
      displayName: dbUser.display_name,
      photoUrl: dbUser.photo_url,
      phoneNumber: dbUser.phone_number,
      dateOfBirth: dbUser.date_of_birth,
      gender: dbUser.gender,
      userRole: dbUser.user_role,
      accountStatus: dbUser.account_status,
      preferencesCompleted: dbUser.preferences_completed,
      fcmToken: dbUser.fcm_token,
      timezone: dbUser.timezone,
      language: dbUser.language,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : null,
    };
  }
}

module.exports = { UserRepository };