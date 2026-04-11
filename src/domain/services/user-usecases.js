// User Use Cases - Business logic for users
class UserUseCases {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async getUserById(userId) {
    return await this.userRepository.findById(userId);
  }

  async getUserByFirebaseUid(firebaseUid) {
    return await this.userRepository.findByFirebaseUid(firebaseUid);
  }

  async syncUser(userData) {
    // Normalize userRole: the Flutter app sends 'customer' for regular users but
    // the DB CHECK constraint only allows 'user', 'therapist', 'admin'.
    const allowedRoles = ['user', 'therapist', 'admin'];
    const normalizedRole = allowedRoles.includes(userData.userRole)
      ? userData.userRole
      : 'user';

    // 1. Check if user exists by Firebase UID
    let user = await this.userRepository.findByFirebaseUid(userData.firebaseUid);

    if (user) {
      // User already linked to this Firebase UID — just update metadata.
      // Never overwrite a saved custom photo (e.g. Cloudinary) with the
      // OAuth provider's avatar — prefer whatever is already in the DB.
      return await this.userRepository.update(user.id, {
        displayName: userData.displayName || user.displayName,
        photoUrl: user.photoUrl || userData.photoUrl,
        fcmToken: userData.fcmToken || user.fcmToken,
        lastLoginAt: new Date(),
      });
    }

    // 2. Check if user exists by email (could have been created via SuperTokens)
    if (userData.email) {
      user = await this.userRepository.findByEmail(userData.email);

      if (user) {
        console.log(
          '✓ Found existing user by email, linking Firebase UID:',
          userData.firebaseUid,
          '→ DB user:',
          user.id
        );

        // Link Firebase UID to the existing account.
        // Same rule: keep any existing custom photo, fall back to OAuth avatar.
        return await this.userRepository.update(user.id, {
          firebaseUid: userData.firebaseUid,
          displayName: userData.displayName || user.displayName,
          photoUrl: user.photoUrl || userData.photoUrl,
          fcmToken: userData.fcmToken || user.fcmToken,
          lastLoginAt: new Date(),
        });
      }
    }

    // 3. No existing user found — create new
    console.log('Creating new user for Firebase UID:', userData.firebaseUid, 'role:', normalizedRole);
    return await this.userRepository.create({
      firebaseUid: userData.firebaseUid,
      email: userData.email,
      displayName: userData.displayName,
      photoUrl: userData.photoUrl,
      fcmToken: userData.fcmToken,
      userRole: normalizedRole,
      accountStatus: 'active',
      preferencesCompleted: false,
      language: 'en',
    });
  }
}

module.exports = { UserUseCases };