class TicketState {
  constructor() {
    this.cryptoMap = new Map();
    this.tradeOptions = new Map();
    this.invitedUsers = new Map();
    this.priceMessage = null;
  }

  setCrypto(channelId, crypto) {
    this.cryptoMap.set(channelId, crypto);
  }

  getCrypto(channelId) {
    return this.cryptoMap.get(channelId);
  }

  setTradeOptions(channelId, options) {
    this.tradeOptions.set(channelId, options);
  }

  getTradeOptions(channelId) {
    return this.tradeOptions.get(channelId);
  }

  addInvitedUser(channelId, userId) {
    this.invitedUsers.set(channelId, userId);
  }

  isUserInvited(channelId) {
    return this.invitedUsers.has(channelId);
  }

  setPriceMessage(message) {
    this.priceMessage = message;
  }

  cleanup(channelId) {
    this.cryptoMap.delete(channelId);
    this.tradeOptions.delete(channelId);
    this.invitedUsers.delete(channelId);
  }
}

module.exports = new TicketState(); 