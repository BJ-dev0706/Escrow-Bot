const crypto = require('crypto');

/**
 * Generates Coinbase API authentication headers
 * @param {string} apiKey - Your Coinbase API key
 * @param {string} apiSecret - Your Coinbase API secret
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} requestPath - Request path without domain (e.g., '/v2/accounts')
 * @param {Object|null} body - Request body for POST requests (optional)
 * @returns {Object} Headers object with authentication details
 */
function generateCoinbaseHeaders(apiKey, apiSecret, method, requestPath, body = null) {
  // Get current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Create the message to sign
  // Format: timestamp + method + requestPath + body (if present)
  let message = timestamp + method + requestPath;
  if (body) {
    message += JSON.stringify(body);
  }
  
  // Create HMAC SHA256 signature using the API secret
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');
  
  // Return headers object
  return {
    'CB-ACCESS-KEY': apiKey,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-VERSION': '2021-04-08',
    'Content-Type': 'application/json'
  };
}

module.exports = {
  generateCoinbaseHeaders
}; 