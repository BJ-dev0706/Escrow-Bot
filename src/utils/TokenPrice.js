const {
  COMMAND_CHANNEL_ID
} = require("../config/constants");
const fetch = require('node-fetch');

const getTokenPrice = async (token) => {
  const symbols = {
    bitcoin: "BTCUSDT",
    ethereum: "ETHUSDT",
    litecoin: "LTCUSDT",
    solana: "SOLUSDT"
  };

  if (!symbols[token]) {
    throw new Error(`Unsupported token: ${token}`);
  }

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbols[token]}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.price) {
      throw new Error(`Invalid price data for ${token}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${token} price:`, error);
    throw error;
  }
};

const postPriceToDiscord = async (client, priceMessage, createPriceEmbed, bot_icon) => {
  try {
    const [Bitcoin, Ethereum, Litecoin, Solana] = await Promise.all([
      getTokenPrice("bitcoin"),
      getTokenPrice("ethereum"),
      getTokenPrice("litecoin"),
      getTokenPrice("solana")
    ]);

    const price = {
      Bitcoin: Bitcoin.price,
      Ethereum: Ethereum.price,
      Litecoin: Litecoin.price,
      Solana: Solana.price      
    }

    const embed = createPriceEmbed(price, bot_icon);

    if (priceMessage) {
      await priceMessage.edit({ embeds: [embed] });
    } else {
      const channel = await client.channels.fetch(COMMAND_CHANNEL_ID);
      priceMessage = await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error fetching price or sending message:', error);
    // Send error message to channel
    const channel = await client.channels.fetch(COMMAND_CHANNEL_ID);
    await channel.send({
      content: "❌ Error fetching token prices. Please try again later.",
      ephemeral: true
    });
  }
};

module.exports = {
  getTokenPrice,
  postPriceToDiscord
};
