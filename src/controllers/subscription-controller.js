const { supabase } = require('../config/supabase-client');

module.exports = {
  // GET /api/v1/subscriptions/me - Get current user subscription
  async getSubscription(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means zero rows found
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Failed to fetch subscription' });
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const subProto = subscription ? {
          id: subscription.id,
          userId: subscription.user_id,
          planId: subscription.plan_id,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date || '',
          paymentMethod: subscription.payment_method,
          lastTransactionId: subscription.last_transaction_id || '',
          isAutoRenew: subscription.is_auto_renew,
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at,
        } : {
           id: '',
           userId: userId,
           planId: '',
           status: 'none',
           startDate: '',
           endDate: '',
           paymentMethod: '',
           lastTransactionId: '',
           isAutoRenew: false,
           createdAt: '',
           updatedAt: ''
        };
        res.proto(subProto, 'resilio.subscription.Subscription');
        return;
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // POST /api/v1/subscriptions - Create or update subscription
  async updateSubscription(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Handle both proto and JSON parsing based on body type
      let payload = req.body;
      let planId, status, paymentProvider, paymentProviderTransactionId, amount, currency;
      
      if (Buffer.isBuffer(req.body)) {
        // If it's a buffer, it was parsed by the proto middleware
        // Currently the proto middleware sets req.protoType, but assuming standard JSON conversion
        // Since we didn't specify the exact proto type to parse IN the middleware here, we must parse it manually
        // Or expect JSON from Flutter (since Dio is flexible or we can send JSON)
        // Let's assume Flutter sends JSON for this, or standard protobuf
        // Assuming body parser handles it if sent as application/json
        payload = req.body;
      }
      
      // Destructure from JSON
      planId = payload.planId || payload.plan_id;
      status = payload.status;
      paymentProvider = payload.paymentProvider || payload.payment_provider;
      paymentProviderTransactionId = payload.paymentProviderTransactionId || payload.payment_provider_transaction_id;
      amount = payload.amount;
      currency = payload.currency || 'NPR';

      if (!planId) {
        return res.status(400).json({ error: 'planId is required' });
      }

      // Calculate end date based on plan
      const now = new Date();
      let endDate = new Date();
      if (planId === 'GOLD') {
        endDate.setDate(now.getDate() + 30);
      } else if (planId === 'PLATINUM') {
        endDate.setDate(now.getDate() + 90);
      } else if (planId === 'DIAMOND') {
        endDate.setDate(now.getDate() + 365);
      } else {
        endDate.setDate(now.getDate() + 30); // fallback
      }

      // 1. Check if existing subscription
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .single();

      let subId;
      let subscription;

      if (existingSub) {
        // Update existing
        const { data: updatedSub, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan_id: planId,
            status: status || 'active',
            end_date: endDate.toISOString(),
            payment_method: paymentProvider || 'esewa',
            last_transaction_id: paymentProviderTransactionId,
            updated_at: now.toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) throw updateError;
        subscription = updatedSub;
        subId = updatedSub.id;
      } else {
        // Insert new
        const { data: newSub, error: insertError } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: userId,
            plan_id: planId,
            status: status || 'active',
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: paymentProvider || 'esewa',
            last_transaction_id: paymentProviderTransactionId
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        subscription = newSub;
        subId = newSub.id;
      }

      // 2. Insert transaction record
      if (paymentProviderTransactionId) {
        await supabase
          .from('transactions')
          .insert([{
            user_id: userId,
            subscription_id: subId,
            payment_provider: paymentProvider || 'esewa',
            payment_provider_transaction_id: paymentProviderTransactionId,
            amount: amount || 0,
            currency: currency,
            status: 'completed',
            plan_id: planId
          }]);
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const subProto = {
          id: subscription.id,
          userId: subscription.user_id,
          planId: subscription.plan_id,
          status: subscription.status,
          startDate: subscription.start_date,
          endDate: subscription.end_date || '',
          paymentMethod: subscription.payment_method,
          lastTransactionId: subscription.last_transaction_id || '',
          isAutoRenew: subscription.is_auto_renew || false,
          createdAt: subscription.created_at,
          updatedAt: subscription.updated_at,
        };
        res.proto(subProto, 'resilio.subscription.Subscription');
        return;
      }

      res.json({ subscription });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // GET /api/v1/subscriptions/transactions - List transactions
  async listTransactions(req, res) {
     try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      if (req.accepts('application/x-protobuf') === 'application/x-protobuf') {
        const txProtos = (transactions || []).map(tx => ({
           id: tx.id,
           userId: tx.user_id,
           subscriptionId: tx.subscription_id || '',
           paymentProvider: tx.payment_provider,
           paymentProviderTransactionId: tx.payment_provider_transaction_id || '',
           amount: Number(tx.amount),
           currency: tx.currency,
           status: tx.status,
           planId: tx.plan_id,
           createdAt: tx.created_at
        }));
        
        res.proto({ transactions: txProtos }, 'resilio.subscription.ListTransactionsResponse');
        return;
      }

      res.json({ transactions });
    } catch (error) {
       console.error('List transactions error:', error);
       res.status(500).json({ error: 'Internal server error' });
    }
  }
};
