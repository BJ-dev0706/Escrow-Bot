const axios = require("axios");
const { generateCoinbaseHeaders } = require("../utils/coinbase-auth");
const COINBASE_CONFIG = require("../config/coinbase");

const BitcoinTransactionTracker = async (address, amount) => {
  try {
    // Get API credentials from config
    const { API_KEY, API_SECRET } = COINBASE_CONFIG;
    
    // Request path for accounts
    const requestPath = '/v2/accounts/bitcoin/transactions';
    
    // Generate authentication headers
    const headers = generateCoinbaseHeaders(API_KEY, API_SECRET, 'GET', requestPath);
    
    const response = await axios.get('https://api.coinbase.com' + requestPath, { headers });

    // Filter transactions based on your criteria
    const transactions = response.data.data;
    const matchingTransaction = transactions.find(transaction => {
      return transaction.address === address && 
             transaction.network === 'bitcoin' &&
             Math.abs(Number(transaction.amount) - amount) <= amount * 0.01;
    });

    return matchingTransaction;
  } catch (error) {
    console.error("Error checking Bitcoin transaction:", error.message);
    throw error;
  }
};

module.exports = {
  BitcoinTransactionTracker
}; 