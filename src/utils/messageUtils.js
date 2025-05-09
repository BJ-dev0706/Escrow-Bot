const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const {
  fetchOriginalMessage,
  updateTradeOptionEmbed,
} = require("../messages/ticket_msgs");

const messageCache = new Map();

// Create an embed with the user's stats
const createStatsEmbed = (
  name,
  avatar,
  deals_completed,
  totalAmount,
  bot_icon
) => {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle(`${name}`)
    .setFields(
      {
        name: "Deals completed:",
        value: `${deals_completed}`,
        inline: false,
      },
      {
        name: "Total Amount:",
        value: `${totalAmount}`,
        inline: false,
      },
    )
    .setThumbnail(avatar)
    .setFooter({
      text: "Powered by BlueBot",
      iconURL: bot_icon,
    })
    .setTimestamp();
  return embed;
};

const createErrorEmbed = (userId) => {
  return new EmbedBuilder()
    .setTitle("Operation Error")
    .setDescription(
      `<@${userId}> You cannot perform the sender and receiver roles simultaneously.`
    )
    .setColor("#FF0000");
};

const CloseTicketEmbed = (bot_icon) => {
  return new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Closing Ticket")
    .setDescription(
      "This ticket is being closed. If you need further assistance, feel free to create a new one."
    )
    .setFooter({ iconURL: bot_icon, text: "Thank you for reaching out!" })
    .setTimestamp();
};

const createSuccessEmbed = (userId, role) => {
  return new EmbedBuilder()
    .setTitle(
      `${role.charAt(0).toUpperCase() + role.slice(1)} Updated Successfully`
    )
    .setDescription(`The ${role} has been successfully set to <@${userId}>.`)
    .setColor("#00FF00");
};

const updateTradeMessage = async (interaction, tradeOptions) => {
  const originalMessage = await fetchOriginalMessage(
    interaction.channel,
    messageCache
  );
  if (originalMessage) {
    const updatedEmbed = await updateTradeOptionEmbed(
      originalMessage.embeds[0],
      tradeOptions
    );
    await originalMessage.edit({ embeds: [updatedEmbed] });
  }
};

const updateMessageWithDisabledButtons = async (message, tradeOptions) => {
  const updatedEmbed = await updateTradeOptionEmbed(
    message.embeds[0],
    tradeOptions
  );
  const disabledButtons = createDisabledButtons();
  await message.edit({
    embeds: [updatedEmbed],
    components: [disabledButtons],
  });
};

const createDisabledButtons = () => {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("set_sender")
      .setLabel("Sender")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("set_receiver")
      .setLabel("Receiver")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("reset_trade")
      .setLabel("Reset")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
};

const createConfirmMessage = (
  title,
  description,
  ConfirmBtnID,
  CancelBtnID
) => {
  const confirmButton = new ButtonBuilder()
    .setCustomId(ConfirmBtnID)
    .setLabel("Confirm")
    .setStyle(ButtonStyle.Success);
  const cancelButton = new ButtonBuilder()
    .setCustomId(CancelBtnID)
    .setLabel("Cancel")
    .setStyle(ButtonStyle.Danger);
  const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("#00FF00");
  return { row, embed };
};

const createPriceEmbed = (prices, bot_icon) => {
  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle("💰 Current Token Prices")
    .setDescription(
      Object.entries(prices)
        .map(
          ([token, value]) => `**${token}**: \`$${Number(value).toFixed(2)}\`` // Format each token's price
        )
        .join("\n")
    )
    .setThumbnail(
      "https://cdn.discordapp.com/icons/1350227726350549002/99aa05e331751f9deff08a49e8530952.webp"
    )
    .setFooter({
      text: "Powered by BlueBot",
      iconURL: bot_icon,
    })
    .setTimestamp();

  return embed;
};

const disableCloseTicketButton = async (channel) => {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const ticketMessage = messages.find(
      (msg) =>
        msg.components?.length > 0 &&
        msg.components[0].components.some((c) => c.customId === "close_ticket")
    );

    if (ticketMessage) {
      const newComponents = ticketMessage.components.map((row) => {
        const newRow = new ActionRowBuilder();
        newRow.addComponents(
          row.components.map((button) => {
            const newButton = ButtonBuilder.from(button);
            if (button.customId === "close_ticket") {
              newButton.setDisabled(true);
            }
            return newButton;
          })
        );
        return newRow;
      });

      await ticketMessage.edit({ components: newComponents });
    }
  } catch (error) {
    console.error("Error disabling close ticket button:", error);
  }
}

module.exports = {
  createErrorEmbed,
  createSuccessEmbed,
  updateTradeMessage,
  updateMessageWithDisabledButtons,
  createDisabledButtons,
  messageCache,
  createConfirmMessage,
  CloseTicketEmbed,
  createPriceEmbed,
  disableCloseTicketButton,
  createStatsEmbed
};
