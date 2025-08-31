import { supabase } from "./supabase-auth";

/**
 * Checks and expires VIB subscriptions that have passed their end date
 * This should be run as a scheduled job (e.g., daily cron job)
 */
export async function expireVibSubscriptions() {
  try {
    console.log('Checking for expired VIB subscriptions...');
    
    const now = new Date().toISOString();
    
    // Find users with expired VIB subscriptions
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, subscription_end_date')
      .eq('role', 'vip')
      .eq('is_premium', true)
      .not('subscription_end_date', 'is', null)
      .lt('subscription_end_date', now);
    
    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return { success: false, error: fetchError.message };
    }
    
    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('No expired VIB subscriptions found');
      return { success: true, expiredCount: 0 };
    }
    
    console.log(`Found ${expiredUsers.length} expired VIB subscriptions`);
    
    // Update expired users to free status
    const userIds = expiredUsers.map(user => user.id);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'free',
        is_premium: false,
        subscription_end_date: null
      })
      .in('id', userIds);
    
    if (updateError) {
      console.error('Error updating expired subscriptions:', updateError);
      return { success: false, error: updateError.message };
    }
    
    console.log(`Successfully expired ${expiredUsers.length} VIB subscriptions`);
    
    return { 
      success: true, 
      expiredCount: expiredUsers.length,
      expiredUsers: expiredUsers.map(u => ({ id: u.id, username: u.username }))
    };
    
  } catch (error) {
    console.error('Unexpected error in expireVibSubscriptions:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Gets count of users who will have their VIB subscription expire soon
 */
export async function getUpcomingExpirations(daysAhead: number = 7) {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, subscription_end_date')
      .eq('role', 'vip')
      .eq('is_premium', true)
      .not('subscription_end_date', 'is', null)
      .lt('subscription_end_date', futureDate.toISOString());
    
    if (error) {
      console.error('Error fetching upcoming expirations:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, count: data?.length || 0, users: data || [] };
    
  } catch (error) {
    console.error('Unexpected error in getUpcomingExpirations:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}
