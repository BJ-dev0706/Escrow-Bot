const { EmbedBuilder } = require("discord.js");

const CommonMsg = async (message, content, color, deleteAfter = 0) => {
  const embed = new EmbedBuilder()
    .setDescription(content)
    .setColor(color)
    .setTimestamp();

  const msg = await message.channel.send({ embeds: [embed] });

  if (deleteAfter > 0) {
    setTimeout(() => msg.delete().catch(console.error), deleteAfter);
  }
};

module.exports = { CommonMsg };
