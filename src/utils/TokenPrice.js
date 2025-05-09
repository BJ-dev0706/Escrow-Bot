const {
  COMMAND_CHANNEL_ID
} = require("../config/constants");

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

  const aprice = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbols[token]}`
  );
  let data = await aprice.json();
  return data;
};

const postPriceToDiscord = async (client, priceMessage, createPriceEmbed, bot_icon) => {
  try {
    const Bitcoin = await getTokenPrice("bitcoin");
    const Ethereum = await getTokenPrice("ethereum");
    const Litecoin = await getTokenPrice("litecoin");
    const Solana = await getTokenPrice("solana");
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
  }
};

module.exports = {
  getTokenPrice,
  postPriceToDiscord
};
