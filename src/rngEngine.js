//RNG
export function calculateNewPrice(currentPrice) {
    const changeFactor = (Math.random() - 0.5) * 2;
    const priceChange = currentPrice * (changeFactor * 0.05);
    const updatedPrice = currentPrice + priceChange;
    
    return updatedPrice.toFixed(2);
}