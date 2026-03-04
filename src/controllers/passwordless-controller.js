// Passwordless Controller - syncs SuperTokens OTP users into Supabase
const { UserRepository } = require('../data/repositories/user-repository');

const userRepository = new UserRepository();

module.exports = {
  /**
   * POST /api/v1/passwordless/complete
   *
   * Called by the Flutter client immediately after a successful OTP verification.
   * The SuperTokens access token has already been validated by authMiddleware,
   * so req.user.id is the authenticated SuperTokens user ID.
   *
   * Upserts the user in Supabase and returns their profile.
   */
  async completeLogin(req, res) {
    try {
      const { email } = req.body;

      // Get SuperTokens user ID from auth middleware
      const superTokensUid = req.user?.id;

      if (!email) {
        return res.status(400).json({ error: 'email is required' });
      }

      console.log('Passwordless complete - syncing user to DB:', email, 'SuperTokens UID:', superTokensUid);

      // Upsert the user (create if new, update last_login_at if existing)
      // Pass SuperTokens UID to link the user for future lookups
      const user = await userRepository.upsertByEmail({
        email,
        displayName: email.split('@')[0],
        superTokensUid,
      });

      console.log('✓ SuperTokens user synced to DB:', user.id, user.email, 'linked ST UID:', user.superTokensUid);

      return res.json({
        status: 'OK',
        user: {
          id: user.id,
          email: user.email,
          display_name: user.displayName,
          user_role: user.userRole,
          preferences_completed: user.preferencesCompleted,
        },
      });
    } catch (error) {
      console.error('Passwordless completeLogin error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};