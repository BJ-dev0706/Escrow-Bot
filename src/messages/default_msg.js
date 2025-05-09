const {
  CONTRACT_CHANNEL_ID,
  CONTRACT_MESSAGE,
} = require("../config/constants");

require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");

const postContractMessage = async (client) => {
  const channel = await client.channels.fetch(CONTRACT_CHANNEL_ID);
  const messages = await channel.messages.fetch({ limit: 50 });

  const existingMessage = messages.find(
    (msg) =>
      msg.embeds.length > 0 &&
      msg.embeds[0].description === CONTRACT_MESSAGE.trim()
  );

  if (existingMessage) {
    console.log(
      "Contract message already exists in the channel. Skipping posting."
    );
    
    return;
  }

  const {row, embed} = await SelectComponent();

  await channel.send({ embeds: [embed], components: [row] });
  console.log("Contract message posted.");
};

const SelectComponent = async () => {
  const embed = new EmbedBuilder()
  .setTitle("Cryptocurrency")
  .setDescription(CONTRACT_MESSAGE)
  .setColor("#2ecc71")
  .setThumbnail(
    "https://cdn.discordapp.com/icons/1350227726350549002/99aa05e331751f9deff08a49e8530952.webp"
  );
  
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("crypto_select")
    .setPlaceholder("Make a selection")
    .addOptions([
      {
        label: "Select a cryptocurrency",
        value: "none",
        description: "Reset selection",
        default: true,
      },
      {
        label: "Bitcoin",
        value: "bitcoin",
        emoji: {
          id: "1329642753419907092",
          name: "bitcoinbtclogo",
        },
      },
      {
        label: "Ethereum",
        value: "ethereum",
        emoji: {
          id: "1329642757765206166",
          name: "ethereumethlogo",
        },
      },
      {
        label: "Litecoin",
        value: "litecoin",
        emoji: {
          id: "1329642749984505947",
          name: "litecoinltclogo",
        },
      },
      {
        label: "Solana",
        value: "solana",
        emoji: {
          id: "1329642759920005120",
          name: "solanalogo",
        },
      }
    ]);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    return {row, embed};
};

module.exports = { postContractMessage, SelectComponent };
