const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { calculateAmountsInUSD } = require("../utils/calculate");
const { getTokenPrice } = require("../utils/TokenPrice");
const { bot_icon } = require("../utils/IconUrl");
const { updateTradeMessage } = require("../utils/messageUtils");

async function handleAmountModalSubmit(interaction, state) {
  try {
    // Check if the interaction has already been deferred or replied
    if (!interaction.deferred && !interaction.replied) {
      // Defer the reply to give more time for processing
      await interaction.deferReply({ ephemeral: true });
    }

    const usdAmount = parseFloat(
      interaction.fields.getTextInputValue("amount_input")
    );
    const channelId = interaction.channel.id;
    const cryptoType = state.getCrypto(channelId);
    const tradeOptions = state.getTradeOptions(channelId);

    if (!tradeOptions || !cryptoType) {
      if (!interaction.replied) {
        return interaction.reply({
          content: "Error: Trade session not found. Please try again.",
          ephemeral: true,
        });
      }
    }

    if (interaction.user.id !== tradeOptions.sender) {
      if (!interaction.replied) {
        return interaction.reply({
          content: "Only the sender can set the amount.",
          ephemeral: true,
        });
      }
    }

    if (isNaN(usdAmount) || usdAmount <= 0) {
      if (!interaction.replied) {
        return interaction.reply({
          content: "Please enter a valid positive dollar amount.",
          ephemeral: true,
        });
      }
    }

    const tokenPrice = await getTokenPrice(cryptoType);
    const cryptoAmount = usdAmount / Number(tokenPrice.price);

    if (usdAmount <= 50) {
      await handleSmallAmount(
        interaction,
        tradeOptions,
        cryptoAmount,
        usdAmount,
        cryptoType,
        tokenPrice,
        state
      );
    } else {
      await handleLargeAmount(
        interaction,
        tradeOptions,
        cryptoAmount,
        usdAmount,
        cryptoType,
        state
      );
    }
  } catch (error) {
    console.error('Error processing amount:', error);
    // Use followUp if the interaction was deferred or replied
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: 'There was an error processing your request.', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
    }
  }
}

async function handleSmallAmount(
  interaction,
  tradeOptions,
  cryptoAmount,
  usdAmount,
  cryptoType,
  tokenPrice,
  state
) {
  tradeOptions.amount = cryptoAmount;
  tradeOptions.feePaymentOption = "split";
  tradeOptions.usdAmount = usdAmount;
  tradeOptions.senderAmountConfirmed = false;
  tradeOptions.receiverAmountConfirmed = false;

  state.setTradeOptions(interaction.channel.id, tradeOptions);

  const { senderPays, receiverGets } = await calculateAmountsInUSD(
    cryptoAmount,
    cryptoType,
    "split"
  );

  const confirmEmbed = new EmbedBuilder()
    .setTitle("Amount Set")
    .setDescription(
      `
Transaction Details:
• USD Amount: $${usdAmount.toFixed(2)}
• Crypto Amount: ${cryptoAmount.toFixed(6)} ${cryptoType.toUpperCase()}
• Current Price: $${Number(tokenPrice.price).toFixed(
        2
      )} per ${cryptoType.toUpperCase()}
• Fee: $0 (Transactions under $50 are FREE)

Final Amounts:
• Sender Pays: ${senderPays.toFixed(6)} ${cryptoType.toUpperCase()} (≈ $${(
        senderPays * Number(tokenPrice.price)
      ).toFixed(2)})
• Receiver Gets: ${receiverGets.toFixed(6)} ${cryptoType.toUpperCase()} (≈ $${(
        receiverGets * Number(tokenPrice.price)
      ).toFixed(2)})

Please confirm to proceed.`
    )
    .setColor("#00FF00")
    .setTimestamp();

  const row = createConfirmationButtons();

  await interaction.editReply({
    content: "Amount set successfully.",
    ephemeral: true,
  });

  await interaction.channel.send({
    embeds: [confirmEmbed],
    components: [row],
  });
}

async function handleLargeAmount(
  interaction,
  tradeOptions,
  cryptoAmount,
  usdAmount,
  cryptoType,
  state
) {
  tradeOptions.tempAmount = cryptoAmount;
  tradeOptions.tempUsdAmount = usdAmount;
  tradeOptions.senderFeeChoice = null;
  tradeOptions.receiverFeeChoice = null;
  state.setTradeOptions(interaction.channel.id, tradeOptions);

  const row = createFeeButtons();

  const { EmbedBuilder } = require("discord.js");

  const embed = new EmbedBuilder()
    .setColor("#00FF00")
    .setTitle("The amount setting has been confirmed")
    .setDescription(
      `Amount set to **$${usdAmount.toFixed(2)}** (${cryptoAmount.toFixed(
        6
      )} ${cryptoType.toUpperCase()}).\n\nBoth parties must agree on who will pay the fee.`
    )
    .setFooter({ text: "Ensure all parties confirm the transaction details." });

  await interaction.channel.send({
    embeds: [embed],
    ephemeral: true,
  });

  await interaction.channel.send({
    components: [row],
  });
}

function createConfirmationButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("confirm_amount")
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("cancel_amount")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Danger)
  );
}

function createFeeButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("fee_sender")
      .setLabel("Sender Pays Fee")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("fee_receiver")
      .setLabel("Receiver Pays Fee")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("fee_split")
      .setLabel("Split Fee")
      .setStyle(ButtonStyle.Primary)
  );
}

function createFinalSummaryEmbed(
  tradeOptions,
  cryptoType,
  senderPays,
  receiverGets,
  fee,
  usdAmount,
  tokenPrice
) {
  return new EmbedBuilder()
    .setTitle("Transaction Summary")
    .setColor("#00FF00")
    .addFields(
      { name: "Sender", value: `<@${tradeOptions.sender}>`, inline: true },
      { name: "Receiver", value: `<@${tradeOptions.receiver}>`, inline: true },
      {
        name: "Crypto Amount",
        value: `${tradeOptions.amount} ${cryptoType.toUpperCase()}`,
        inline: true,
      },
      {
        name: "Current Price",
        value: `$${tokenPrice.toFixed(2)}`,
        inline: true,
      },
      { name: "USD Value", value: `$${usdAmount.toFixed(2)}`, inline: true },
      { name: "Fee", value: `$${fee.toFixed(2)}`, inline: true },
      {
        name: "Sender Pays",
        value: `${senderPays.toFixed(6)} ${cryptoType.toUpperCase()}`,
        inline: true,
      },
      {
        name: "Receiver Gets",
        value: `${receiverGets.toFixed(6)} ${cryptoType.toUpperCase()}`,
        inline: true,
      },
      {
        name: "Fee Payment",
        value: `${
          tradeOptions.feePaymentOption.charAt(0).toUpperCase() +
          tradeOptions.feePaymentOption.slice(1)
        }`,
        inline: true,
      },
      {
        name: "Address",
        value: "`ltc1qgqvpaa3mdxa3rzlnwpxz537llymnpsn47sc52e`",
        inline: false,
      },
      { name: "Status", value: "Confirmed by both parties", inline: false }
    )
    .setTimestamp();
}

async function cleanupMessages(interaction) {
  const messages = await interaction.channel.messages.fetch({ limit: 100 });

  // Find and handle various messages to clean up...
  const messagesToHandle = [
    { type: "close_ticket", action: "delete" },
    { type: "cancel_amount", action: "disable" },
    { type: "set_amount", action: "disable" },
  ];

  for (const messageConfig of messagesToHandle) {
    const message = messages.find(
      (msg) =>
        msg.components?.length > 0 &&
        msg.components[0].components?.some(
          (component) => component.customId === messageConfig.type
        )
    );

    if (message) {
      try {
        if (messageConfig.action === "delete") {
          await message.delete();
        } else if (messageConfig.action === "disable") {
          const disabledButtons = message.components[0].components.map(
            (button) => {
              const newButton = ButtonBuilder.from(button);
              newButton.setDisabled(true);
              return newButton;
            }
          );

          const disabledRow = new ActionRowBuilder().addComponents(
            disabledButtons
          );
          await message.edit({ components: [disabledRow] });
        }
      } catch (error) {
        console.log(
          `Could not handle ${messageConfig.type} message:`,
          error.message
        );
      }
    }
  }
}

async function handleError(interaction, error) {
  const errorMessage =
    error.message || "An unexpected error occurred. Please try again.";

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({
      content: errorMessage,
      ephemeral: true,
    });
  } else {
    await interaction.editReply({
      content: errorMessage,
      ephemeral: true,
    });
  }
}

function calculateAmountWithFee(amount, feePercentage) {
  console.log(`Calculating fee for amount: ${amount} with fee percentage: ${feePercentage}`);
  if (feePercentage > 0) {
    const fee = amount * (feePercentage / 100);
    console.log(`Calculated fee: ${fee}`);
    return amount - fee;
  }
  return amount;
}

module.exports = {
  handleAmountModalSubmit,
  createFinalSummaryEmbed,
  cleanupMessages
};
