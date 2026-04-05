const { supabase } = require('../../config/supabase-client');

class TherapistRepository {
  async getProfile(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('*, users!inner(*)')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return this._mapToProfile(data);
  }

  async getProfileByUserId(userId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('therapist_profiles')
      .select('*, users!inner(*)')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return this._mapToProfile(data);
  }

  async listProfiles(specialtyTag = null, limit = 10, offset = 0) {
    if (!supabase) return { therapists: [], total: 0 };
    let query = supabase.from('therapist_profiles').select('*, users!inner(*)', { count: 'exact' });
    
    if (specialtyTag) {
      query = query.ilike('specialty', `%${specialtyTag}%`);
    }
    
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error || !data) return { therapists: [], total: 0 };
    
    return {
      therapists: data.map(this._mapToProfile),
      total: count || 0
    };
  }

  async createProfile(profileData) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('therapist_profiles')
      .insert({
        user_id: profileData.userId,
        bio: profileData.bio,
        specialty: profileData.specialty,
        qualifications: profileData.qualifications || [],
        years_of_experience: profileData.yearsOfExperience || 0,
        consultation_fee: profileData.consultationFee,
        is_verified: false,
        rating: 0
      })
      .select()
      .single();
    if (error) throw error;
    return this._mapToProfile(data);
  }

  async updateProfile(id, updateData) {
    if (!supabase) return null;
    const payload = {};
    if (updateData.bio !== undefined) payload.bio = updateData.bio;
    if (updateData.specialty !== undefined) payload.specialty = updateData.specialty;
    if (updateData.qualifications !== undefined) payload.qualifications = updateData.qualifications;
    if (updateData.yearsOfExperience !== undefined) payload.years_of_experience = updateData.yearsOfExperience;
    if (updateData.isVerified !== undefined) payload.is_verified = updateData.isVerified;
    if (updateData.consultationFee !== undefined) payload.consultation_fee = updateData.consultationFee;

    const { data, error } = await supabase
      .from('therapist_profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this._mapToProfile(data);
  }

  _mapToProfile(row) {
    return {
      id: row.id,
      userId: row.user_id,
      bio: row.bio,
      specialty: row.specialty,
      qualifications: row.qualifications || [],
      yearsOfExperience: row.years_of_experience,
      isVerified: row.is_verified,
      consultationFee: row.consultation_fee,
      rating: row.rating,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = { TherapistRepository };
