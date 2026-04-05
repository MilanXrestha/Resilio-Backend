const { supabase } = require('../config/supabase-client');

class AppointmentRepository {
  async createAppointment(data) {
    if (!supabase) return null;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: data.patientId,
        therapist_id: data.therapistId,
        scheduled_time: data.scheduledTime,
        status: 'pending',
        payment_status: 'pending',
        meeting_room_id: data.meetingRoomId
      })
      .select()
      .single();
    if (error) throw error;
    return this._map(appointment);
  }

  async getAppointment(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return this._map(data);
  }

  async listAppointments(patientId, therapistId, status) {
    if (!supabase) return { appointments: [], total: 0 };
    let query = supabase.from('appointments').select('*', { count: 'exact' });
    if (patientId) query = query.eq('patient_id', patientId);
    if (therapistId) query = query.eq('therapist_id', therapistId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;
    return { appointments: data.map(this._map), total: count || 0 };
  }

  async updateStatus(id, status, paymentStatus = null, transactionId = null) {
    if (!supabase) return null;
    const payload = { status };
    if (paymentStatus) payload.payment_status = paymentStatus;
    if (transactionId) payload.payment_transaction_id = transactionId;

    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this._map(data);
  }

  _map(row) {
    return {
      id: row.id,
      patientId: row.patient_id,
      therapistId: row.therapist_id,
      scheduledTime: row.scheduled_time,
      status: row.status,
      paymentStatus: row.payment_status,
      paymentTransactionId: row.payment_transaction_id,
      meetingRoomId: row.meeting_room_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

const appointmentRepo = new AppointmentRepository();

module.exports = {
  async scheduleAppointment(req, res) {
    try {
      const { therapist_id, scheduled_time } = req.body;
      const patient_id = req.user?.id;
      if (!patient_id) return res.status(401).json({ error: 'Unauthorized' });

      const meetingRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const appointment = await appointmentRepo.createAppointment({
        patientId: patient_id,
        therapistId: therapist_id,
        scheduledTime: scheduled_time,
        meetingRoomId
      });

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(appointment, 'resilio.appointment.Appointment');
        return;
      }
      res.status(201).json({ appointment });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getAppointment(req, res) {
    try {
      const appointment = await appointmentRepo.getAppointment(req.params.id);
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto(appointment, 'resilio.appointment.Appointment');
        return;
      }
      res.json({ appointment });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async listAppointments(req, res) {
    try {
      const { patient_id, therapist_id, status } = req.query;
      const { appointments, total } = await appointmentRepo.listAppointments(patient_id, therapist_id, status);
      
      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        res.proto({ appointments, pagination: { total, limit: 100, offset: 0 } }, 'resilio.appointment.ListAppointmentsResponse');
        return;
      }
      res.json({ appointments, pagination: { total, limit: 100, offset: 0 } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Export repo for payment verification use
  appointmentRepo
};
