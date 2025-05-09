require("dotenv").config();
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { bot_icon } = require('../utils/IconUrl');

const sol_logo = "https://cryptologos.cc/logos/solana-sol-logo.png";
const eth_logo = "https://cryptologos.cc/logos/ethereum-eth-logo.png";
const btc_logo = "https://cryptologos.cc/logos/bitcoin-btc-logo.png";
const ltc_logo = "https://cryptologos.cc/logos/litecoin-ltc-logo.png";

const Ticket_defaultMessage = async (
  ticketChannel,
  interaction,
  selectedCrypto
) => {
  try {
    await ticketChannel.send(
      `<@${interaction.user.id}> Welcome to the ticket!`
    );
    
    let chain =
      selectedCrypto.charAt(0).toUpperCase() + selectedCrypto.slice(1);
    
    let logo = "";
    if (chain === "Solana") logo = sol_logo;
    else if (chain === "Ethereum") logo = eth_logo;
    else if (chain === "Bitcoin") logo = btc_logo;
    else if (chain === "Litecoin") logo = ltc_logo;

    if (!logo) {
      logo = "https://cdn.discordapp.com/icons/1350227726350549002/99aa05e331751f9deff08a49e8530952.webp";
    }

    const embed = new EmbedBuilder()
      .setTitle("Cryptocurrency Middleman System")
      .setDescription(
        `**${chain} Middleman request created successfully!**\n\nWelcome to our automated cryptocurrency Middleman system! Your cryptocurrency will be stored securely for the duration of this deal. Please notify support for assistance.\n\nTicket #${Math.floor(
          10000 + Math.random() * 90000
        )}`
      )
      .setColor("#2ecc71")
      .setThumbnail(logo);

    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🚧 Close")
      .setStyle(ButtonStyle.Danger);

    const actionRow = new ActionRowBuilder().addComponents(closeButton);

    await ticketChannel.send({ embeds: [embed], components: [actionRow] });

    const securityEmbed = new EmbedBuilder()
      .setColor("#da373c")
      .setTitle("Security Notification")
      .setDescription(
        "Our bot and staff team will **NEVER** direct message you. Ensure all conversations related to the deal are done within this ticket. Failure to do so may put you at risk of being scammed."
      );

    await ticketChannel.send({ embeds: [securityEmbed] });

    const notificationEmbed = new EmbedBuilder()
      .setColor("#2ecc71")
      .setTitle("Ticket Use Guidelines")
      .setDescription(
        "**Who are you dealing with?**\n\n- **Tag**: e.g., `@user`\n- **User ID**: e.g., `123456789123456789`"
      );

    await ticketChannel.send({ embeds: [notificationEmbed] });
  } catch (error) {
    console.error("Error sending default ticket message:", error);
  }
};

const TicketOpenMsg = async (channel, selectedCrypto) => {
  const embed = new EmbedBuilder()
    .setTitle("Ticket Created")
    .setDescription(`Welcome to your ${selectedCrypto.toUpperCase()} trade ticket!`)
    .setColor("#00ff00")
    .setTimestamp()
    .setFooter({ text: "Trade System", iconURL: bot_icon });

  await channel.send({ embeds: [embed] });
};

const InviteConfirmMessage = async (message, user) => {
  const ConfirmationInviteEmbed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle("Trading Partner Successfully Added")
    .setDescription(
      `This ticket is now configured to facilitate secure communication and transaction management between <@${message.author.id}> and <@${user.id}>.`
    )
    .setFooter({
      text: "Ensure all interactions adhere to platform guidelines.",
    })
    .setTimestamp();

  await message.reply({ embeds: [ConfirmationInviteEmbed] });
};

const TradeOptionMessage = async (cryptoType, channel, tradeOptions) => {
  const embed = new EmbedBuilder()
    .setTitle(`${cryptoType.toUpperCase()} Trade Options`)
    .setDescription(
      `Please select your role in this trade:
      
Current Status:
Sender: ${tradeOptions.sender ? `<@${tradeOptions.sender}>` : `Not Set`}
Receiver: ${tradeOptions.receiver ? `<@${tradeOptions.receiver}>` : `Not Set`}`
    )
    .setColor("#0099ff")
    .setTimestamp()
    .setFooter({ text: "Trade System", iconURL: bot_icon });

  const senderButton = new ButtonBuilder()
    .setCustomId("set_sender")
    .setLabel("Set as Sender")
    .setStyle(ButtonStyle.Primary);

  const receiverButton = new ButtonBuilder()
    .setCustomId("set_receiver")
    .setLabel("Set as Receiver")
    .setStyle(ButtonStyle.Primary);

  const resetButton = new ButtonBuilder()
    .setCustomId("reset_trade")
    .setLabel("Reset")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(
    senderButton,
    receiverButton,
    resetButton
  );

  return await channel.send({
    embeds: [embed],
    components: [row],
  });
}

const FeeCounter = async (amount) => {
  if (!amount) {
    console.log("Invalid amount:", amount);
    return null;
  }

  const fee = amount >= 250 ? amount * 0.01 : amount >= 50 ? 2 : 0;
  return amount - fee;
};

const fetchOriginalMessage = async (channel) => {
  const messages = await channel.messages.fetch({ limit: 100 });
  return messages.find(msg => 
    msg.embeds.length > 0 && 
    msg.embeds[0].title && 
    msg.embeds[0].title.includes("Trade Options")
  );
}

const updateTradeOptionEmbed = async (originalEmbed, tradeOptions) => {
  return new EmbedBuilder()
    .setTitle(originalEmbed.title)
    .setDescription(
      `Please select your role in this trade:
      
Current Status:
Sender: ${tradeOptions.sender ? `<@${tradeOptions.sender}>` : 'Not Set'}
Receiver: ${tradeOptions.receiver ? `<@${tradeOptions.receiver}>` : 'Not Set'}`
    )
    .setColor(originalEmbed.color)
    .setTimestamp()
    .setFooter(originalEmbed.footer);
}

module.exports = {
  Ticket_defaultMessage,
  TradeOptionMessage,
  TicketOpenMsg,
  fetchOriginalMessage,
  updateTradeOptionEmbed,
  InviteConfirmMessage,
  FeeCounter,
};
