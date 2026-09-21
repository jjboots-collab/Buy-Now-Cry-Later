//PORTFOLIO UPDATES
import { supabase } from '../js/supabaseClient.js';

export async function executeBuyTrade(userId, stockId, quantity, price) {
    const response = await supabase
        .from('D5_portfolios')
        .insert([
            {
                user_id: userId,
                stock_id: stockId,
                quantity: quantity,
                average_buy_price: price
            }
        ]);

    return response;
}