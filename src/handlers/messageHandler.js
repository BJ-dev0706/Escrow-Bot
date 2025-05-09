const { TICKET_CATEGORY_ID } = require('../config/constants');
const { TradeOptionMessage } = require('../messages/ticket_msgs');
const { CommonMsg } = require('../messages/common_msg');

async function handleMessageCreate(message, state) {
  if (message.author.bot || message.channel.parentId !== TICKET_CATEGORY_ID) return;
  
  const mentionedUsers = message.mentions.users;
  const userIds = message.content.match(/\b\d{17,19}\b/g);
  
  if (mentionedUsers.size > 0 || userIds) {
    const channelId = message.channel.id;
    const usersToInvite = new Set();
    
    mentionedUsers.forEach((user) => usersToInvite.add(user.id));
    if (userIds) {
      userIds.forEach((id) => usersToInvite.add(id));
    }
    
    const [userId] = usersToInvite;
    if (!userId) return;

    if (state.isUserInvited(channelId)) {
      return;
    }
    
    try {
      const guild = message.guild;
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        await CommonMsg(
          message,
          `User <@${userId}> was not found in the server.`,
          "#FF0000",
          5000
        );
        return;
      }

      await message.channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
      });

      state.addInvitedUser(channelId, userId);

      await CommonMsg(
        message,
        `Successfully added <@${userId}> to the ticket.`,
        "#00FF00"
      );

      const cryptoType = state.getCrypto(channelId);
      const tradeOptions = state.getTradeOptions(channelId);

      if (cryptoType && tradeOptions) {
        await TradeOptionMessage(
          cryptoType,
          message.channel,
          tradeOptions
        );
      }

    } catch (error) {
      console.error(`Error inviting user ${userId}:`, error);
      await CommonMsg(
        message,
        "An error occurred while adding the user to the ticket.",
        "#FF0000"
      );
    }
  }
}

module.exports = {
  handleMessageCreate
}; 