const { handleAmountModalSubmit } = require("./amountHandler");
const { handleSenderAddressModalSubmit } = require("./addressHandler");
const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

const {
  SOLANA_ADDRESS,
  BITCOIN_ADDRESS,
  ETHEREUM_ADDRESS,
  LITECOIN_ADDRESS,
} = require("../config/constants");

const modalHandlers = {
  amount_modal: handleAmountModalSubmit,
  sender_add_modal: handleSenderAddressModalSubmit,
  wallet_modal: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);
      const walletAddress =
        interaction.fields.getTextInputValue("wallet_input");

      let cryptoType = state.getCrypto(interaction.channel.id);
      console.log(cryptoType, "before switch");
      let address = "";

      switch (cryptoType) {
        case "solana":
          address = SOLANA_ADDRESS;
          break;
        case "bitcoin":
          address = BITCOIN_ADDRESS;
          break;
        case "ethereum":
          address = ETHEREUM_ADDRESS;
          break;
        case "litecoin":
          address = LITECOIN_ADDRESS;
          break;
      }
      console.log(address, "after switch");

      if (!walletAddress) {
        return await interaction.reply({
          content: "Please enter a valid wallet address.",
          ephemeral: true,
        });
      }

      tradeOptions.senderWalletAddress = walletAddress;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      const walletConfirmEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Wallet Address Confirmed")
        .setDescription("Transaction is ready to proceed")
        .addFields(
          { name: "Sender Wallet", value: walletAddress || "N/A" },
          { name: "Middleman Wallet", value: address || "N/A" },
          {
            name: "Amount to Send",
            value: `${tradeOptions.senderPays || 0} ${state.getCrypto(
              interaction.channel.id
            )}`,
          }
        )
        .setFooter({
          text: "Please press this button immediately after sending",
        })
        .setTimestamp();
      const confirmSentButton = new ButtonBuilder()
        .setCustomId("confirm_final")
        .setLabel("Final Confirmation")
        .setStyle(ButtonStyle.Success);
      const copyAddressButton = new ButtonBuilder()
        .setCustomId("copy_address")
        .setLabel("Copy Address")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(
        confirmSentButton,
        copyAddressButton
      );

      await interaction.reply({
        embeds: [walletConfirmEmbed],
        components: [row],
      });
    } catch (error) {
      console.error("Error in wallet_modal:", error);
      await interaction.reply({
        content: "An error occurred while setting the wallet address.",
        ephemeral: true,
      });
    }
  },
  receiver_wallet_modal: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);
      const walletAddress = interaction.fields.getTextInputValue(
        "receiver_wallet_input"
      );

      let cryptoType = state.getCrypto(interaction.channel.id);
      let address = "";
      switch (cryptoType) {
        case "solana":
          address = SOLANA_ADDRESS;
          break;
        case "bitcoin":
          address = BITCOIN_ADDRESS;
          break;
        case "ethereum":
          address = ETHEREUM_ADDRESS;
          break;
        case "litecoin":
          address = LITECOIN_ADDRESS;
          break;
      }

      if (!walletAddress) {
        return await interaction.reply({
          content: "Please enter a valid wallet address.",
          ephemeral: true,
        });
      }

      tradeOptions.senderWalletAddress = walletAddress;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      const walletConfirmEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Receiver Wallet Address Confirmed")
        .setDescription("Transaction is ready to proceed")
        .addFields(
          { name: "Receiver Wallet", value: walletAddress || "N/A" },
          { name: "Middleman Wallet", value: address || "N/A" },
          {
            name: "Receiver can withdraw this amount",
            value: `${tradeOptions.senderPays || 0} ${state.getCrypto(
              interaction.channel.id
            )}`,
          }
        )
        .setFooter({
          text: "Please press this button immediately after sending",
        })
        .setTimestamp();
      const confirmSentButton = new ButtonBuilder()
        .setCustomId("confirm_withdraw")
        .setLabel("Withdraw Confirmation")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(confirmSentButton);

      await interaction.reply({
        embeds: [walletConfirmEmbed],
        components: [row],
      });
    } catch (error) {
      console.error("Error in wallet_modal:", error);
      await interaction.reply({
        content: "An error occurred while setting the wallet address.",
        ephemeral: true,
      });
    }
  },
  confirm_withdraw: async function (interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    const AlarmEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setDescription(
        `Processing your transaction. Please wait a moment while we complete the transfer.`
      )
      .setFooter({
        text: "Please wait for the transaction to be confirmed.",
        iconURL:
          "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGticjc4eTBnN3VtMHA5dTVxNTMwa3VpZjJnMnUzcjczZXh6NjBiaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1WAaVrcZYBpL7u0yVh/giphy.gif",
      })
      .setTimestamp();
    await interaction.channel.send({
      embeds: [AlarmEmbed],
      ephemeral: true,
    });
  },
};

module.exports = modalHandlers;
