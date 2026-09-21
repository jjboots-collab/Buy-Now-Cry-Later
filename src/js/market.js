//STOCKS TO DASHBOARD
import { fetchAllStocks } from '../api/stocks.js';

async function displayMarketData() {
    const stocks = await fetchAllStocks();
    const container = document.getElementById('stockList');
    
    if (container) {
        container.innerHTML = JSON.stringify(stocks);
    }
}

displayMarketData();