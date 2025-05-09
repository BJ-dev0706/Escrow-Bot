const { connectToDatabase } = require("../../DB/database");
const Stats = require("../../models/stats");
const { bot_icon, default_avatar } = require("../utils/IconUrl");
const { COMMAND_CHANNEL_ID } = require("../config/constants");

const GetStats = async (client, user, createStatsEmbed) => {
  await connectToDatabase();
  try {
    let embed = null;
    const stats = await Stats.findOne({ userId: user.id });
    let avatar = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp` : default_avatar;
    if (!stats) {
      embed = createStatsEmbed(
        user.globalName,
        avatar,
        0,
        0,
        bot_icon
      );

    } else {
      embed = createStatsEmbed(
        user.globalName,
        avatar,
        stats.deals_completed,
        stats.totalAmount,
        bot_icon
      );
    }

    const channel = await client.channels.fetch(COMMAND_CHANNEL_ID);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error("Error fetching stats", err);
    throw new Error("Error fetching stats");
  }
};

module.exports = {
  GetStats,
};
