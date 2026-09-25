//CASH BALANCE
import { supabase } from '../js/supabaseClient.js';

export async function updateCashBalance(userId, newBalance) {
    const response = await supabase
        .from('D1_users')
        .update({ cash_balance: newBalance })
        .eq('user_id', userId);

    return response;
}