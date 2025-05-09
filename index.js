require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
} = require("discord.js");
const { postContractMessage } = require("./src/messages/default_msg");
const { setupCommands } = require('./src/setup/commands');
const { handleInteraction } = require('./src/handlers/interactionHandler');
const { handleMessageCreate } = require('./src/handlers/messageHandler');
const {
  DISCORD_TOKEN,
} = require("./src/config/constants");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const state = {
  ticketCryptoMap: new Map(),
  ticketTradeOptions: new Map(),
  invitedUsers: new Map(),
  priceMessage: null,
  buttonHandlers: require('./src/handlers/buttonHandlers'),
  modalHandlers: require('./src/handlers/modalHandlers'),
  
  getCrypto(channelId) {
    return this.ticketCryptoMap.get(channelId);
  },
  
  setCrypto(channelId, crypto) {
    this.ticketCryptoMap.set(channelId, crypto);
  },
  
  getTradeOptions(channelId) {
    return this.ticketTradeOptions.get(channelId);
  },
  
  setTradeOptions(channelId, options) {
    this.ticketTradeOptions.set(channelId, options);
  },
  
  isUserInvited(channelId) {
    return this.invitedUsers.has(channelId);
  },
  
  addInvitedUser(channelId, userId) {
    this.invitedUsers.set(channelId, userId);
  },
  
  cleanup(channelId) {
    this.ticketCryptoMap.delete(channelId);
    this.ticketTradeOptions.delete(channelId);
    this.invitedUsers.delete(channelId);
  }
};

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  postContractMessage(client);
  await setupCommands(client);
});

client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, state);
});

client.on("messageCreate", async (message) => {
  await handleMessageCreate(message, state);
});

client.on("channelDelete", (channel) => {
  state.cleanup(channel.id);
  console.log(`Cleaned up data for deleted channel ID: ${channel.id}`);
});

client.login(DISCORD_TOKEN);
