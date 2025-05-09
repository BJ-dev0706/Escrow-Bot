const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { createConfirmMessage, updateTradeMessage } = require('../utils/messageUtils');

const handleRoleSet = async (interaction, state, role) => {
  try {
    await interaction.deferReply({ ephemeral: true });
    const tradeOptions = state.ticketTradeOptions.get(interaction.channel.id);

    if (role === 'sender') {
      tradeOptions.sender = interaction.user.id;
    } else {
      tradeOptions.receiver = interaction.user.id;
    }

    state.ticketTradeOptions.set(interaction.channel.id, tradeOptions);
    await updateTradeMessage(interaction, tradeOptions);

    if (tradeOptions.sender && tradeOptions.receiver) {
      const confirmMsg = createConfirmMessage(
        "Confirmation Needed",
        "Are you sure you want to proceed with this sender and receiver?",
        "confirm_role",
        "cancel_trade"
      );
      await interaction.channel.send({
        embeds: [confirmMsg.embed],
        components: [confirmMsg.row],
      });
    }

    const successEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setDescription(`Successfully set as ${role}`)
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error("Error in handleRoleSet:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content: "An error occurred while setting the role. Please try again.",
        ephemeral: true,
      });
    }
  }
};

const handleRoleConfirmation = async (interaction, state) => {
  const tradeOptions = state.getTradeOptions(interaction.channel.id);

  if (interaction.user.id !== tradeOptions.sender && interaction.user.id !== tradeOptions.receiver) {
    return interaction.reply({
      content: "You are not part of this trade.",
      ephemeral: true
    });
  }

  const role = interaction.user.id === tradeOptions.sender ? 'sender' : 'receiver';
  
  if (role === 'sender') {
    tradeOptions.senderConfirmed = true;
  } else {
    tradeOptions.receiverConfirmed = true;
  }
  
  state.setTradeOptions(interaction.channel.id, tradeOptions);

  const confirmEmbed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Role Confirmation')
    .setDescription(`<@${interaction.user.id}> has confirmed their role as ${role}`)
    .setTimestamp();

  await interaction.reply({
    content: `You have confirmed your role as ${role}.`,
    ephemeral: true
  });

  await interaction.channel.send({ embeds: [confirmEmbed] });

  if (tradeOptions.senderConfirmed && tradeOptions.receiverConfirmed) {
    const bothConfirmedEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Roles Confirmed')
      .setDescription('Both parties have confirmed their roles.')
      .addFields(
        { name: 'Sender', value: `<@${tradeOptions.sender}>`, inline: true },
        { name: 'Receiver', value: `<@${tradeOptions.receiver}>`, inline: true }
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [bothConfirmedEmbed] });

    const setAmountButton = new ButtonBuilder()
      .setCustomId('set_amount')
      .setLabel('Set Amount')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(setAmountButton);

    const nextStepEmbed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('Next Step')
      .setDescription('Sender can now set the transaction amount using the button below.')
      .setTimestamp();

    await interaction.channel.send({ 
      embeds: [nextStepEmbed],
      components: [row]
    });

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 10 });
      const confirmMsg = messages.find(msg => 
        msg.embeds[0]?.title === "Confirmation Needed" &&
        msg.components[0]?.components.some(c => c.customId === "confirm_role")
      );
      if (confirmMsg) {
        await confirmMsg.delete();
      }
    } catch (error) {
      console.error("Error deleting confirmation message:", error);
    }
  }
}

module.exports = {
  handleRoleSet,
  handleRoleConfirmation
}; 