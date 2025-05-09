const { SlashCommandBuilder } = require('@discordjs/builders');

const setupCommands = async (client) => {
  try {
    const priceCommand = new SlashCommandBuilder()
      .setName("price")
      .setDescription("Fetches and displays current token prices");

    const statsCommand = new SlashCommandBuilder()
      .setName("stats")
      .setDescription("Get user transaction statistics");

    const commands = [priceCommand, statsCommand];

    await client.application.commands.set(commands);
    console.log('Slash commands registered successfully');
  } catch (error) {
    console.error('Error setting up commands:', error);
  }
}

module.exports = {
  setupCommands
};
