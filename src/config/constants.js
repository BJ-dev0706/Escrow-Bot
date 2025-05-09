require("dotenv").config();

module.exports = {
  CONTRACT_CHANNEL_ID: process.env.CONTRACT_CHANNEL_ID,
  TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID,
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID,
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  COMMAND_CHANNEL_ID: process.env.COMMAND_CHANNEL_ID,
  CONTRACT_MESSAGE: `
**Fees**:
- Deals $250+: **1%**
- Deals under $250: **$2**
- Deals under $50 are **FREE**
Press the dropdown below to select & initiate a deal involving either **Bitcoin**, **Ethereum**, **Litecoin**, or **Solana**.
  `,
  SOLANA_ADDRESS: process.env.SOLANA_ADDRESS,
  BITCOIN_ADDRESS: process.env.BITCOIN_ADDRESS,
  ETHEREUM_ADDRESS: process.env.ETHEREUM_ADDRESS,
  LITECOIN_ADDRESS: process.env.LITECOIN_ADDRESS,
};
