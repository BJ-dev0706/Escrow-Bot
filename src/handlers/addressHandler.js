const { EmbedBuilder } = require('discord.js');

const handleSenderAddressModalSubmit = async (interaction, state) => {
  try {
    const address = interaction.fields.getTextInputValue("sender_add_input");
    const channelId = interaction.channel.id;
    const tradeOptions = state.ticketTradeOptions.get(channelId);

    if (!tradeOptions) {
      return interaction.reply({
        content: "Error: Trade session not found. Please try again.",
        ephemeral: true,
      });
    }

    if (interaction.user.id !== tradeOptions.sender) {
      return interaction.reply({
        content: "Only the sender can set the wallet address.",
        ephemeral: true,
      });
    }

    if (!address || address.trim().length < 26) {
      return interaction.reply({
        content: "Please enter a valid wallet address.",
        ephemeral: true,
      });
    }

    tradeOptions.senderAddress = address;
    state.ticketTradeOptions.set(channelId, tradeOptions);

    const addressEmbed = new EmbedBuilder()
      .setTitle("Wallet Address Confirmed")
      .setDescription(`Sender's wallet address has been set to:\n\`${address}\``)
      .setColor("#00FF00")
      .setTimestamp();

    await interaction.reply({
      content: "Wallet address set successfully.",
      ephemeral: true,
    });

    await interaction.channel.send({
      embeds: [addressEmbed],
    });

  } catch (error) {
    console.error("Error processing address:", error);
    await interaction.reply({
      content: "An error occurred while setting the wallet address. Please try again.",
      ephemeral: true,
    });
  }
}

module.exports = {
  handleSenderAddressModalSubmit
}; 