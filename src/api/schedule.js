//UPDATE MARKET HOURS
import { supabase } from '../js/supabaseClient.js';

export async function updateMarketHours(openTime, closeTime) {
    const response = await supabase
        .from('D3_market_schedule')
        .update({ open_time: openTime, close_time: closeTime })
        .eq('schedule_id', 1);

    return response;
}