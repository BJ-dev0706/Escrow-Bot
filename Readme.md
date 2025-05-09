# Crypto Escrow Discord Bot

A secure and reliable cryptocurrency escrow bot for Discord that facilitates safe trading between users, with support for Bitcoin, Ethereum, Litecoin, and Solana.

![Discord Bot Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 📋 Features

- **Multi-Cryptocurrency Support**: Handles Bitcoin, Ethereum, Litecoin, and Solana transactions
- **Automated Ticket System**: Creates private channels for each transaction
- **Real-time Price Tracking**: Fetches current cryptocurrency prices from Binance API
- **Transaction Security**: Ensures both parties confirm all transaction details
- **Automatic Fee Calculation**: Different fee tiers based on transaction amount
- **User Statistics**: Track completed deals and total transaction volume
- **Role-Based Permissions**: Admin-specific commands and controls

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher)
- Discord Bot Token
- MongoDB Account (for transaction history)
- Cryptocurrency wallets for receiving funds

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BJ-dev0706/Escrow-Bot.git
   cd crypto-escrow-discord-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   ADMIN_ROLE_ID=your_admin_role_id
   TICKET_CATEGORY_ID=your_ticket_category_id
   CONTRACT_CHANNEL_ID=your_contract_channel_id
   COMMAND_CHANNEL_ID=your_command_channel_id
   SOLANA_ADDRESS=your_solana_wallet_address
   BITCOIN_ADDRESS=your_bitcoin_wallet_address
   ETHEREUM_ADDRESS=your_ethereum_wallet_address
   LITECOIN_ADDRESS=your_litecoin_wallet_address
   MONGO_URI=your_mongodb_connection_string
   ```

4. Start the bot:
   ```bash
   npm start
   ```

## 💰 Fee Structure

The bot automatically applies the following fee structure:
- Deals $250+: **1%**
- Deals under $250: **$2**
- Deals under $50 are **FREE**

## 🤖 Commands

- `/price` - Display current prices for all supported cryptocurrencies
- `/stats` - Show user's transaction history and statistics

## 📊 Transaction Flow

1. User selects cryptocurrency in the contract channel
2. Private ticket channel is created
3. Sender and receiver confirm their roles
4. Amount is entered and confirmed by both parties
5. Bot calculates fee and presents payment options
6. Both parties confirm transaction details
7. Transaction is completed after necessary confirmations

## 🔐 Security Features

- Private ticket channels with permission controls
- Two-step confirmation for all critical actions
- Automatic cleanup of channel data after completion
- Role-based access restrictions

## 🛠️ Built With

- [Discord.js](https://discord.js.org/) - Discord API framework
- [MongoDB](https://www.mongodb.com/) - Database for transaction history
- [Axios](https://axios-http.com/) - HTTP client for API requests
- [Web3.js](https://web3js.readthedocs.io/) - Ethereum blockchain interaction
- [Ethers.js](https://docs.ethers.org/) - Ethereum wallet implementation
- [Bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib) - Bitcoin implementation
- [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana blockchain interaction

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Binance API](https://binance-docs.github.io/apidocs/) for real-time cryptocurrency prices
- [Discord.js Guide](https://discordjs.guide/) for documentation and examples
