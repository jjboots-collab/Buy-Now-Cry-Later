//STOCK CREATION
import { supabase } from '../js/supabaseClient.js';

export async function createStock(ticker, companyName, volume, price) {
    const response = await supabase
        .from('D2_stocks')
        .insert([
            { 
                ticker: ticker, 
                company_name: companyName, 
                total_volume: volume, 
                current_price: price 
            }
        ]);

    if (response.error) {
        alert('Failed to create stock');
    } else {
        alert('Stock created successfully');
    }
}

export async function fetchAllStocks() {
    const response = await supabase
        .from('D2_stocks')
        .select('*');
        
    return response.data;
}