//ADMIN PANEL LISTENER
import { createStock } from '../api/stocks.js';

function handleStockFormSubmit(event) {
    event.preventDefault();
    const ticker = document.getElementById('ticker').value;
    const name = document.getElementById('companyName').value;
    const volume = document.getElementById('volume').value;
    const price = document.getElementById('price').value;

    createStock(ticker, name, volume, price);
}

const form = document.getElementById('createStockForm');
if (form) {
    form.addEventListener('submit', handleStockFormSubmit);
}