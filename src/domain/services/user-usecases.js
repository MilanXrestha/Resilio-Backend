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
    // 1. Check if user exists by Firebase UID
    let user = await this.userRepository.findByFirebaseUid(userData.firebaseUid);

    if (user) {
      // User already linked to this Firebase UID. Refresh login metadata but
      // DO NOT overwrite an existing display name / photo — keep whatever the
      // account already has (respects profile edits and stops the name from
      // flipping between login methods). Only fill them if currently empty.
      return await this.userRepository.update(user.id, {
        displayName: user.displayName || userData.displayName,
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

        // Link Firebase UID to the existing account
        return await this.userRepository.update(user.id, {
          firebaseUid: userData.firebaseUid,
          displayName: userData.displayName || user.displayName,
          photoUrl: userData.photoUrl || user.photoUrl,
          fcmToken: userData.fcmToken || user.fcmToken,
          lastLoginAt: new Date(),
        });
      }
    }

    // 3. No existing user found — create new
    console.log('Creating new user for Firebase UID:', userData.firebaseUid);
    return await this.userRepository.create({
      ...userData,
      userRole: userData.userRole || 'user',
      accountStatus: 'active',
      preferencesCompleted: false,
      language: 'en',
    });
  }
}

module.exports = { UserUseCases };