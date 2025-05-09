const {
  EmbedBuilder
} = require("discord.js");
const {
  TICKET_CATEGORY_ID,
  ADMIN_ROLE_ID,
  COMMAND_CHANNEL_ID,
} = require("../config/constants");
const {
  Ticket_defaultMessage,
  TicketOpenMsg,
} = require("../messages/ticket_msgs");
const { createPriceEmbed, createStatsEmbed } = require("../utils/messageUtils");
const { postPriceToDiscord } = require("../utils/TokenPrice");
const { GetStats } = require("../utils/getStats");
const { SelectComponent } = require("../messages/default_msg");

const handleInteraction = async (interaction, state) => {
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "crypto_select"
  ) {
    await handleCryptoSelect(interaction, state);
  } else if (interaction.isButton()) {
    await handleButtonInteraction(interaction, state);
  } else if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction, state);
  } else if (interaction.isCommand()) {
    await handleSlashCommand(interaction, state);
  }
}

const handleCryptoSelect = async(interaction, state) => {
  const selectedCrypto = interaction.values[0];
  if (selectedCrypto === "none") {
    return interaction.reply({
      content: "Please select a valid cryptocurrency.",
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  const categoryChannel = guild.channels.cache.get(TICKET_CATEGORY_ID);

  if (!categoryChannel || categoryChannel.type !== 4) {
    return interaction.reply({
      content: "Ticket category not found. Please contact an admin.",
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${interaction.user.username}-${selectedCrypto}`,
      type: 0,
      parent: categoryChannel.id,
      permissionOverwrites: [
        { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
        { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
        { id: ADMIN_ROLE_ID, allow: ["ViewChannel", "SendMessages"] },
      ],
    });

    state.ticketCryptoMap.set(ticketChannel.id, selectedCrypto);
    state.ticketTradeOptions.set(ticketChannel.id, {
      sender: null,
      receiver: null,
      usdAmount: 0,
      coinAmount: 0,
      middlemanwallet: null,
      roleSenderConfirmed: false,
      roleReceiverConfirmed: false,
      amountSenderConfirmed: false,
      amountReceiverConfirmed: false,
      feeSenderConfirmed: false,
      feeReceiverConfirmed: false,
      senderWalletConfirmed: false,
      receiverWalletConfirmed: false,
    });

    await TicketOpenMsg(ticketChannel, selectedCrypto);
    await Ticket_defaultMessage(ticketChannel, interaction, selectedCrypto);

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Ticket Created Successfully!")
      .setDescription(`Please check ${ticketChannel}`)
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      ephemeral: true,
    });
    const { row } = await SelectComponent();
    await interaction.message.edit({
      components: [row],
    });
  } catch (error) {
    console.error("Error creating ticket channel:", error);
    await interaction.editReply({
      content: "An error occurred while creating the ticket. Please try again.",
      ephemeral: true,
    });
  }
}

const handleButtonInteraction = async (interaction, state) => {
  const tradeOptions = state.ticketTradeOptions.get(interaction.channel.id);
  if (!tradeOptions) {
    return interaction.reply({
      content: "Error: Trade options not initialized for this ticket.",
      ephemeral: true,
    });
  }

  const handler = state.buttonHandlers[interaction.customId];
  if (handler) {
    await handler(interaction, state);
  } else {
    await interaction.reply({
      content: "Unknown button action.",
      ephemeral: true,
    });
  }
}

const handleModalSubmit = async (interaction, state) => {
  try {
    const handler = state.modalHandlers[interaction.customId];
    if (handler) {
      await handler(interaction, state);
    } else {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({
          content: "Unknown modal submission.",
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "There was an error processing your request.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error processing your request.",
        ephemeral: true,
      });
    }
  }
}

const handleSlashCommand = async (interaction, state) => {
  const { commandName, channelId } = interaction;
  if (channelId !== COMMAND_CHANNEL_ID) {
    await interaction.reply({
      content: "This command can only be used in command channels.",
      ephemeral: true,
    });
    return;
  }
  if (commandName === "price") {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Token Prices")
          .setDescription("Fetching current token prices...")
          .setColor("#00ff00"),
      ],
      ephemeral: true,
    });
    await postPriceToDiscord(
      interaction.client,
      state.priceMessage,
      createPriceEmbed
    );
  }
  if (commandName === "stats") {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("Fetching stats...")
          .setColor("#00ff00"),
      ],
      ephemeral: true,
    });
    await GetStats(interaction.client, interaction.user, createStatsEmbed);
  }
}

module.exports = {
  handleInteraction,
};
