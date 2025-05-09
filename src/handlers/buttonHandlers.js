const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const {
  createErrorEmbed,
  createSuccessEmbed,
  updateTradeMessage,
  createConfirmMessage,
  CloseTicketEmbed,
  disableCloseTicketButton,
} = require("../utils/messageUtils");
const { handleRoleConfirmation, handleRoleSet } = require("./roleHandler");
const { bot_icon } = require("../utils/IconUrl");
const { getTokenPrice } = require("../utils/TokenPrice");
const {
  SOLANA_ADDRESS,
  BITCOIN_ADDRESS,
  ETHEREUM_ADDRESS,
  LITECOIN_ADDRESS,
} = require("../config/constants");
const { LitecoinTransactionTracker } = require("../track/litecoin");

const buttonHandlers = {
  async close_ticket(interaction, state) {
    const channel = interaction.channel;
    if (!channel) {
      return interaction.reply(
        "Error: Unable to close the ticket. The channel does not exist."
      );
    }
    const embed = CloseTicketEmbed(bot_icon);
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
    setTimeout(async () => {
      try {
        state.cleanup(channel.id);
        await channel.delete();
      } catch (error) {
        console.error("Error deleting channel:", error);
      }
    }, 5000);
  },

  async set_sender(interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      if (tradeOptions.sender !== null) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(
                `Sender role is already set to <@${tradeOptions.sender}>`
              ),
          ],
          ephemeral: true,
        });
      }

      if (tradeOptions.receiver === interaction.user.id) {
        return interaction.reply({
          embeds: [createErrorEmbed("You cannot be both sender and receiver!")],
          ephemeral: true,
        });
      }

      tradeOptions.sender = interaction.user.id;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      await handleRoleSet(interaction, state, "sender");
    } catch (error) {
      console.error("Error in set_sender:", error);
      await interaction.reply({
        content:
          "An error occurred while setting the sender role. Please try again.",
        ephemeral: true,
      });
    }
  },

  async set_receiver(interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      // Check if receiver is already set
      if (tradeOptions.receiver !== null) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription(
                `Receiver role is already set to <@${tradeOptions.receiver}>`
              ),
          ],
          ephemeral: true,
        });
      }

      // Check if user is not already the sender
      if (tradeOptions.sender === interaction.user.id) {
        return interaction.reply({
          embeds: [createErrorEmbed("You cannot be both sender and receiver!")],
          ephemeral: true,
        });
      }

      // Set the receiver
      tradeOptions.receiver = interaction.user.id;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Update the trade message and send confirmation
      await handleRoleSet(interaction, state, "receiver");
    } catch (error) {
      console.error("Error in set_receiver:", error);
      await interaction.reply({
        content:
          "An error occurred while setting the receiver role. Please try again.",
        ephemeral: true,
      });
    }
  },

  async reset_trade(interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      tradeOptions.sender= null,
      tradeOptions.receiver= null,
      tradeOptions.usdAmount= 0,
      tradeOptions.coinAmount= 0,
      tradeOptions.middlemanwallet= null,
      tradeOptions.roleSenderConfirmed= false,
      tradeOptions.roleReceiverConfirmed= false,
      tradeOptions.amountSenderConfirmed= false,
      tradeOptions.amountReceiverConfirmed= false,
      tradeOptions.feeSenderConfirmed= false,
      tradeOptions.feeReceiverConfirmed= false,
      tradeOptions.senderWalletConfirmed= false,
      tradeOptions.receiverWalletConfirmed= false,

      // Update state with reset options
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Send reset confirmation message
      const resetEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Trade Reset")
        .setDescription(
          "All trade roles and settings have been reset. You can start over by selecting new roles."
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [resetEmbed],
        ephemeral: true,
      });

      // Update the trade message to reflect the reset
      await updateTradeMessage(interaction, tradeOptions);

      // Delete any existing confirmation messages
      // try {
      //   const messages = await interaction.channel.messages.fetch({
      //     limit: 10,
      //   });
      //   const messagesToDelete = messages.filter(
      //     (msg) =>
      //       (msg.embeds[0]?.title === "Confirmation Needed" &&
      //         msg.components[0]?.components.some(
      //           (c) => c.customId === "confirm_role"
      //         )) ||
      //       msg.components[0]?.components.some(
      //         (c) =>
      //           c.customId === "confirm_amount" ||
      //           c.customId === "cancel_amount" ||
      //           c.customId === "fee_sender" ||
      //           c.customId === "fee_receiver" ||
      //           c.customId === "fee_split"
      //       )
      //   );

      //   for (const msg of messagesToDelete.values()) {
      //     await msg.delete().catch(console.error);
      //   }
      // } catch (error) {
      //   console.error("Error deleting messages:", error);
      // }
    } catch (error) {
      console.error("Error in reset_trade:", error);
      await interaction.reply({
        content:
          "An error occurred while resetting the trade. Please try again.",
        ephemeral: true,
      });
    }
  },

  async confirm_role(interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    await handleRoleConfirmation(interaction, state);
  },

  async set_amount(interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    if (interaction.user.id !== tradeOptions.sender) {
      return interaction.reply({
        content: "Only the sender can set the amount.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("amount_modal")
      .setTitle("Set Transaction Amount");

    const amountInput = new TextInputBuilder()
      .setCustomId("amount_input")
      .setLabel("Enter the amount in USD")
      .setStyle(1)
      .setPlaceholder("Enter the USD amount (e.g. 100.50)")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(amountInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },

  async confirm_amount(interaction, state) {
    try {
      await handleAmountConfirmation(interaction, state);
    } catch (error) {
      console.error("Error in confirm_amount:", error);
      await interaction.reply({
        content:
          "An error occurred while confirming the amount. Please try again.",
        ephemeral: true,
      });
    }
  },

  async cancel_amount(interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      // Reset amount and fee related options
      tradeOptions.amount = 0;
      tradeOptions.tempAmount = 0;
      tradeOptions.usdAmount = 0;
      tradeOptions.tempUsdAmount = 0;
      tradeOptions.fee = 0;
      tradeOptions.feePaymentOption = null;
      tradeOptions.senderFeeChoice = null;
      tradeOptions.receiverFeeChoice = null;

      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Send cancellation message
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("Amount setting cancelled."),
        ],
        ephemeral: true,
      });

      // Update the trade message
      await updateTradeMessage(interaction, tradeOptions);

      // Delete the confirmation message
      // try {
      //   const messages = await interaction.channel.messages.fetch({
      //     limit: 10,
      //   });
      //   const confirmMsg = messages.find(
      //     (msg) =>
      //       msg.components?.length > 0 &&
      //       msg.components[0].components.some(
      //         (c) =>
      //           c.customId === "confirm_amount" ||
      //           c.customId === "cancel_amount"
      //       )
      //   );
      //   if (confirmMsg) {
      //     await confirmMsg.delete();
      //   }
      // } catch (error) {
      //   console.error("Error deleting confirmation message:", error);
      // }
    } catch (error) {
      console.error("Error in cancel_amount:", error);
      await interaction.reply({
        content:
          "An error occurred while cancelling the amount. Please try again.",
        ephemeral: true,
      });
    }
  },

  async fee_sender(interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    if (
      interaction.user.id !== tradeOptions.sender &&
      interaction.user.id !== tradeOptions.receiver
    ) {
      return interaction.reply({
        content:
          "Only the sender or receiver can select the fee payment option.",
        ephemeral: true,
      });
    }

    await handleFeeSelection(interaction, state, "sender");
  },

  async fee_receiver(interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    if (
      interaction.user.id !== tradeOptions.sender &&
      interaction.user.id !== tradeOptions.receiver
    ) {
      return interaction.reply({
        content:
          "Only the sender or receiver can select the fee payment option.",
        ephemeral: true,
      });
    }

    await handleFeeSelection(interaction, state, "receiver");
  },

  async fee_split(interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    if (
      interaction.user.id !== tradeOptions.sender &&
      interaction.user.id !== tradeOptions.receiver
    ) {
      return interaction.reply({
        content:
          "Only the sender or receiver can select the fee payment option.",
        ephemeral: true,
      });
    }

    await handleFeeSelection(interaction, state, "split");
  },

  async cancel_trade(interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      // Reset all trade options
      tradeOptions.sender = null;
      tradeOptions.receiver = null;
      tradeOptions.amount = 0;
      tradeOptions.selectedCrypto = null;
      tradeOptions.senderFeeChoice = null;
      tradeOptions.receiverFeeChoice = null;
      tradeOptions.feePaymentOption = null;
      tradeOptions.senderConfirmed = false;
      tradeOptions.receiverConfirmed = false;

      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Send cancellation message
      const cancelEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Trade Cancelled")
        .setDescription(
          "The trade setup has been cancelled. You can start over by selecting new roles."
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [cancelEmbed],
        ephemeral: true,
      });

      // Update the trade message to reflect the reset
      await updateTradeMessage(interaction, tradeOptions);

      // Delete the confirmation message if it exists
      try {
        const messages = await interaction.channel.messages.fetch({
          limit: 10,
        });
        const confirmationMsg = messages.find(
          (msg) =>
            msg.embeds[0]?.title === "Confirmation Needed" &&
            msg.components[0]?.components.some(
              (c) => c.customId === "confirm_role"
            )
        );
        if (confirmationMsg) {
          await confirmationMsg.delete();
        }
      } catch (error) {
        console.error("Error deleting confirmation message:", error);
      }
    } catch (error) {
      console.error("Error in cancel_trade:", error);
      await interaction.reply({
        content:
          "An error occurred while cancelling the trade. Please try again.",
        ephemeral: true,
      });
    }
  },

  final_confirm: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);
      const cryptoType = state.getCrypto(interaction.channel.id);

      // Verify user is part of the trade
      if (
        interaction.user.id !== tradeOptions.sender &&
        interaction.user.id !== tradeOptions.receiver
      ) {
        return await interaction.reply({
          content: "Only the sender or receiver can confirm the transaction.",
          ephemeral: true,
        });
      }

      // Update confirmation status
      if (interaction.user.id === tradeOptions.sender) {
        tradeOptions.senderFinalConfirmed = true;
      } else {
        tradeOptions.receiverFinalConfirmed = true;
      }

      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Create confirmation embed
      const userConfirmEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Transaction Confirmation")
        .setDescription(
          `<@${interaction.user.id}> has confirmed the transaction details.`
        )
        .setTimestamp();

      await interaction.channel.send({ embeds: [userConfirmEmbed] });

      // If both parties have confirmed
      if (
        tradeOptions.senderFinalConfirmed &&
        tradeOptions.receiverFinalConfirmed
      ) {
        let address = "";
        switch (cryptoType) {
          case "solana":
            address = SOLANA_ADDRESS;
            break;
          case "bitcoin":
            address = BITCOIN_ADDRESS;
            break;
          case "ethereum":
            address = ETHEREUM_ADDRESS;
            break;
          case "litecoin":
            address = LITECOIN_ADDRESS;
            break;
        }

        const finalConfirmEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("Transaction Details Confirmed")
          .setDescription(
            `Both parties have confirmed the transaction details.\nSender, please enter your wallet address.`
          )
          .addFields(
            { name: "Crypto Type", value: cryptoType, inline: true },
            {
              name: "Amount",
              value: `${tradeOptions.tempAmount} ${cryptoType}`,
              inline: true,
            },
            {
              name: "Fee",
              value: `${tradeOptions.fee.toFixed(8)} ${cryptoType}`,
              inline: true,
            },
            {
              name: "Sender Pays",
              value: `${tradeOptions.senderPays.toFixed(8)} ${cryptoType}`,
              inline: true,
            },
            {
              name: "Receiver Gets",
              value: `${tradeOptions.receiverGets.toFixed(8)} ${cryptoType}`,
              inline: true,
            }
          )
          .setTimestamp();

        if (address) {
          finalConfirmEmbed.addFields({
            name: "Middleman Address",
            value: address,
          });
        }

        await interaction.channel.send({
          embeds: [finalConfirmEmbed],
        });

        const warningEmbed = new EmbedBuilder()
          .setColor("#FFA500")
          .setTitle("⚠️ Wallet Address Confirmation")
          .setDescription(
            "Putting the wrong sender address can result to a loss of funds! If we can not recover it, then we are not responsible."
          )
          .setTimestamp();

        const setWalletButton = new ButtonBuilder()
          .setCustomId("set_sender_wallet")
          .setLabel("Enter Sender Wallet Address")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(setWalletButton);

        await interaction.channel.send({
          embeds: [warningEmbed],
          components: [row],
        });

        await disableCloseTicketButton(interaction.channel);

        try {
          const messages = await interaction.channel.messages.fetch({
            limit: 10,
          });
          const confirmMsg = messages.find(
            (msg) =>
              msg.components?.length > 0 &&
              msg.components[0].components.some(
                (c) =>
                  c.customId === "final_confirm" ||
                  c.customId === "cancel_transaction"
              )
          );
          if (confirmMsg) {
            await confirmMsg.delete();
          }
        } catch (error) {
          console.error("Error deleting confirmation message:", error);
        }
      }
    } catch (error) {
      console.error("Error in final_confirm:", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: "An error occurred while processing your confirmation.",
          ephemeral: true,
        });
      }
    }
  },

  set_sender_wallet: async function (interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);

    if (interaction.user.id !== tradeOptions.sender) {
      return interaction.reply({
        content: "Only the sender can set the wallet address.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("wallet_modal")
      .setTitle("Enter Wallet Address");

    const walletInput = new TextInputBuilder()
      .setCustomId("wallet_input")
      .setLabel("Your wallet address")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the wallet address you will send from")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(walletInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },

  confirm_sender_wallet: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      if (interaction.user.id !== tradeOptions.sender) {
        return interaction.reply({
          content: "Only the sender can confirm the wallet address.",
          ephemeral: true,
        });
      }

      tradeOptions.senderWalletConfirmed = true;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      const confirmEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Wallet Address Confirmed")
        .setDescription("Sender has confirmed their wallet address.")
        .addFields({
          name: "Wallet Address",
          value: tradeOptions.senderWalletAddress,
        })
        .setTimestamp();

      const confirmSentButton = new ButtonBuilder()
        .setCustomId("confirm_final")
        .setLabel("Final confirmation")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(confirmSentButton);

      await interaction.reply({ embeds: [confirmEmbed], components: [row] });

      try {
        const messages = await interaction.channel.messages.fetch({
          limit: 10,
        });
        const walletMsg = messages.find(
          (msg) =>
            msg.components?.length > 0 &&
            msg.components[0].components.some(
              (c) =>
                c.customId === "confirm_sender_wallet" ||
                c.customId === "edit_sender_wallet"
            )
        );
        if (walletMsg) {
          await walletMsg.delete();
        }
      } catch (error) {
        console.error("Error deleting wallet confirmation message:", error);
      }
    } catch (error) {
      console.error("Error in confirm_sender_wallet:", error);
      await interaction.reply({
        content: "An error occurred while confirming the wallet address.",
        ephemeral: true,
      });
    }
  },

  confirm_receiver_wallet: async function (interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);

    if (interaction.user.id !== tradeOptions.receiver) {
      return interaction.reply({
        content: "Only the receiver can edit the wallet address.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("receiver_wallet_modal")
      .setTitle("Edit Wallet Address");

    const walletInput = new TextInputBuilder()
      .setCustomId("receiver_wallet_input")
      .setLabel("Receiver wallet address")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Enter the wallet address you will send from")
      .setValue(tradeOptions.senderWalletAddress || "")
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(walletInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },

  confirm_final: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      if (interaction.user.id !== tradeOptions.sender) {
        return interaction.reply({
          content: "Only the sender can confirm the transaction has been sent.",
          ephemeral: true,
        });
      }

      const tradescanembed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Transaction Confirmation in Progress")
        .setDescription(
          "The bot is currently confirming the transaction. Please wait a moment."
        )
        .addFields(
          {
            name: "Sender Wallet Address",
            value: tradeOptions.senderWalletAddress,
            inline: false,
          },
          {
            name: "Transaction Amount",
            value: `${tradeOptions.senderPays} ${state.getCrypto(
              interaction.channel.id
            )}`,
            inline: false,
          }
        )
        .setFooter({
          text: "Please wait for the transaction to be confirmed.",
          iconURL:
            "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGticjc4eTBnN3VtMHA5dTVxNTMwa3VpZjJnMnUzcjczZXh6NjBiaCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1WAaVrcZYBpL7u0yVh/giphy.gif",
        })
        .setTimestamp();
      await interaction.channel.send({ embeds: [tradescanembed] });
      const cryptoType = state.getCrypto(interaction.channel.id);
      console.log(tradeOptions);
      let address = "";
      switch (cryptoType) {
        case "solana":
          address = SOLANA_ADDRESS;
          break;
        case "bitcoin":
          address = BITCOIN_ADDRESS;
          break;
        case "ethereum":
          address = ETHEREUM_ADDRESS;
          break;
        case "litecoin":
          address = LITECOIN_ADDRESS;
          break;
      }

      const result = await LitecoinTransactionTracker(
        address,
        tradeOptions.senderWalletAddress,
        tradeOptions.senderPays
      );
      if (result) {
        const successEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("Transaction Confirmed")
          .setDescription("The transaction has been confirmed.")
          .setFields({
            name: "Transaction Link",
            value: result.transaction_link,
          })
          .setTimestamp();
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm_transaction")
            .setLabel("Confirm Transaction")
            .setStyle(ButtonStyle.Success)
        );
        await interaction.channel.send({
          embeds: [successEmbed],
          components: [row],
        });
      } else {
        const notFoundEmbed = new EmbedBuilder()
          .setColor("#FFA500")
          .setTitle("Transaction Not Found")
          .setDescription("No matching transaction was found. Click rescan to try again.")
          .setTimestamp();

        const rescanButton = new ButtonBuilder()
          .setCustomId("rescan_transaction")
          .setLabel("Rescan Transaction")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(rescanButton);

        await interaction.channel.send({
          embeds: [notFoundEmbed],
          components: [row],
        });
      }
    } catch (error) {
      console.error("Error in confirm_final:", error);
      await interaction.reply({
        content: "An error occurred while confirming the transaction.",
        ephemeral: true,
      });
    }
  },

  confirm_transaction: async function (interaction, state) {
    if (!state.TransactionConfirmCount) {
      state.TransactionConfirmCount = 0;
    }

    state.TransactionConfirmCount += 1;

    const embed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Transaction Release Confirmation")
      .setDescription("Two confirmations are required to release the transaction.")
      .addFields(
        { 
          name: "Current Status", 
          value: `${state.TransactionConfirmCount}/2 confirmations received` 
        },
        {
          name: "Last Confirmation By",
          value: `<@${interaction.user.id}>`
        }
      )
      .setTimestamp();

    const releaseButton = new ButtonBuilder()
      .setCustomId("release_sender")
      .setLabel("Release Transaction")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
      .addComponents(releaseButton);

    if (state.TransactionConfirmCount >= 2) {
      embed.setDescription("Transaction has been released!")
        .setColor("#00FF00")
        .setFields(
          { 
            name: "Status", 
            value: "✅ Transaction Released" 
          }
        );

      await interaction.reply({
        embeds: [embed],
        components: []
      });

      state.TransactionConfirmCount = 0;
    } else {
      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  },

  cancel_transaction: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);

      // Verify user is part of the trade
      if (
        interaction.user.id !== tradeOptions.sender &&
        interaction.user.id !== tradeOptions.receiver
      ) {
        return await interaction.reply({
          content: "Only the sender or receiver can cancel the transaction.",
          ephemeral: true,
        });
      }

      // Reset confirmation statuses
      tradeOptions.senderFinalConfirmed = false;
      tradeOptions.receiverFinalConfirmed = false;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      const cancelEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Transaction Cancelled")
        .setDescription(
          `<@${interaction.user.id}> has cancelled the transaction confirmation.`
        )
        .setTimestamp();

      await interaction.reply({ embeds: [cancelEmbed] });

      // Clean up buttons
      try {
        const messages = await interaction.channel.messages.fetch({
          limit: 10,
        });
        const confirmMsg = messages.find(
          (msg) =>
            msg.components?.length > 0 &&
            msg.components[0].components.some(
              (c) =>
                c.customId === "final_confirm" ||
                c.customId === "cancel_transaction"
            )
        );
        if (confirmMsg) {
          await confirmMsg.delete();
        }
      } catch (error) {
        console.error("Error deleting confirmation message:", error);
      }
    } catch (error) {
      console.error("Error in cancel_transaction:", error);
      if (!interaction.replied) {
        await interaction.reply({
          content: "An error occurred while cancelling the transaction.",
          ephemeral: true,
        });
      }
    }
  },

  copy_address: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);
      const cryptoType = state.getCrypto(interaction.channel.id);
      let address = "";

      switch (cryptoType) {
        case "solana":
          address = SOLANA_ADDRESS;
          break;
        case "bitcoin":
          address = BITCOIN_ADDRESS;
          break;
        case "ethereum":
          address = ETHEREUM_ADDRESS;
          break;
        case "litecoin":
          address = LITECOIN_ADDRESS;
          break;
      }

      if (address) {
        await interaction.reply({
          content: `The ${cryptoType} address is: \`${address}\`. Please copy it manually.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "No address available to copy.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error("Error in handleCopyAddress:", error);
      await interaction.reply({
        content: "An error occurred while trying to copy the address.",
        ephemeral: true,
      });
    }
  },

  release_sender: async function (interaction, state) {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    if (interaction.user.id !== tradeOptions.sender) {
      return interaction.reply({
        content: "Only the sender can release the transaction.",
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')  // Set the color to green for success
      .setTitle('Authorization Confirmation')
      .setDescription('The sender has authorized the release of funds.')
      .addFields(
        { name: 'Sender:', value: `${tradeOptions.senderWalletAddress}`, inline: true },
        { name: 'Amount:', value: `$${tradeOptions.usdAmount}`, inline: true }, // Replace with actual amount
        { name: 'Authorization Status:', value: 'Approved', inline: true },
        { name: 'Date:', value: new Date().toLocaleString(), inline: true }
      )
      .setTimestamp()
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirm_receiver_wallet")
          .setLabel("Enter receiver wallet")
          .setStyle(ButtonStyle.Success)
      );
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },

  rescan_transaction: async function (interaction, state) {
    try {
      const tradeOptions = state.getTradeOptions(interaction.channel.id);
      const cryptoType = state.getCrypto(interaction.channel.id);
      
      let address = "";
      switch (cryptoType) {
        case "solana":
          address = SOLANA_ADDRESS;
          break;
        case "bitcoin":
          address = BITCOIN_ADDRESS;
          break;
        case "ethereum":
          address = ETHEREUM_ADDRESS;
          break;
        case "litecoin":
          address = LITECOIN_ADDRESS;
          break;
      }

      // Show scanning message
      await interaction.reply({
        content: "Rescanning for transaction...",
        ephemeral: true
      });

      const result = await LitecoinTransactionTracker(
        tradeOptions.senderWalletAddress,
        address,
        tradeOptions.senderPays
      );

      if (result) {
        const successEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("Transaction Confirmed")
          .setDescription("The transaction has been confirmed.")
          .setFields({
            name: "Transaction Link",
            value: result.transaction_link,
          })
          .setTimestamp();
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("confirm_transaction")
            .setLabel("Confirm Transaction")
            .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({
          embeds: [successEmbed],
          components: [row],
        });

        // Try to delete the previous "not found" message
        try {
          await interaction.message.delete();
        } catch (error) {
          console.error("Error deleting previous message:", error);
        }
      } else {
        await interaction.editReply({
          content: "Still no transaction found. You can try scanning again.",
          ephemeral: true
        });
      }
    } catch (error) {
      console.error("Error in rescan_transaction:", error);
      await interaction.reply({
        content: "An error occurred while rescanning for the transaction.",
        ephemeral: true
      });
    }
  },
};

async function handleFeeSelection(interaction, state, feeOption) {
  try {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);
    const cryptoType = state.getCrypto(interaction.channel.id);
    const result = await getTokenPrice(cryptoType);
    const tokenPrice = result.price;

    if (
      interaction.user.id !== tradeOptions.sender &&
      interaction.user.id !== tradeOptions.receiver
    ) {
      return interaction.reply({
        content:
          "Only the sender or receiver can select the fee payment option.",
        ephemeral: true,
      });
    }

    // Initialize fee confirmation if not already set
    if (!tradeOptions.selectedFeeOption) {
      tradeOptions.selectedFeeOption = feeOption;
      tradeOptions.senderFeeConfirmed = false;
      tradeOptions.receiverFeeConfirmed = false;
    }

    // Check if trying to select a different fee option
    if (tradeOptions.selectedFeeOption !== feeOption) {
      return interaction.reply({
        content: `Cannot select a different fee option. Current selection is: ${tradeOptions.selectedFeeOption}`,
        ephemeral: true,
      });
    }

    // Update fee confirmation status
    if (interaction.user.id === tradeOptions.sender) {
      tradeOptions.senderFeeConfirmed = true;
    } else {
      tradeOptions.receiverFeeConfirmed = true;
    }

    state.setTradeOptions(interaction.channel.id, tradeOptions);

    const confirmEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Fee Option Confirmation")
      .setDescription(
        `<@${interaction.user.id}> has confirmed the fee payment option: ${feeOption}`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [confirmEmbed] });

    if (tradeOptions.senderFeeConfirmed && tradeOptions.receiverFeeConfirmed) {
      const baseAmount = tradeOptions.tempAmount;
      const usdAmount = tradeOptions.tempUsdAmount;

      let calculatedFee;
      if (usdAmount >= 250) {
        calculatedFee = 2 / tokenPrice;
      } else if (usdAmount >= 50) {
        calculatedFee = baseAmount * 0.01;
      }

      let senderPays, receiverGets, feeDescription;
      switch (feeOption) {
        case "sender":
          senderPays = baseAmount + calculatedFee;
          receiverGets = baseAmount;
          feeDescription = `Fee (${calculatedFee.toFixed(
            8
          )} ${cryptoType}) added to sender's payment`;
          break;

        case "receiver":
          senderPays = baseAmount;
          receiverGets = baseAmount - calculatedFee;
          feeDescription = `Fee ($${calculatedFee}) deducted from receiver's amount`;
          break;

        case "split":
          const halfFee = calculatedFee / 2;
          senderPays = baseAmount + halfFee;
          receiverGets = baseAmount - halfFee;
          feeDescription =
            `Fee (${calculatedFee.toFixed(8)} ${cryptoType}) split equally:\n` +
            `Sender: +${halfFee.toFixed(8)} ${cryptoType}\n` +
            `Receiver: -${halfFee.toFixed(8)} ${cryptoType}`;
          break;
      }

      // Save final amounts
      tradeOptions.fee = calculatedFee;
      tradeOptions.senderPays = senderPays;
      tradeOptions.receiverGets = receiverGets;
      state.setTradeOptions(interaction.channel.id, tradeOptions);

      // Calculate USD values
      const senderPaysUSD = senderPays * tokenPrice;
      const receiverGetsUSD = receiverGets * tokenPrice;

      // Create final summary embed
      const finalSummaryEmbed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Final Transaction Summary")
        .setDescription("Both parties have confirmed the fee payment option.")
        .addFields(
          {
            name: "Base Amount",
            value: `${baseAmount} ${cryptoType} ($${usdAmount.toFixed(2)})`,
            inline: true,
          },
          { name: "Token Price", value: `$${tokenPrice}`, inline: true },
          { name: "\u200B", value: "\u200B", inline: true },
          { name: "Fee Details", value: feeDescription },
          {
            name: "Final Transaction Details",
            value:
              `💰 Sender Pays: ${Number(senderPays).toFixed(
                8
              )} ${cryptoType} ($${Number(senderPaysUSD).toFixed(2)})\n` +
              `📥 Receiver Gets: ${Number(receiverGets).toFixed(
                8
              )} ${cryptoType} ($${Number(receiverGetsUSD).toFixed(2)})`,
          },
          {
            name: "Fee Rate",
            value: `${Number(calculatedFee).toFixed(8)} ${cryptoType}`,
          },
          {
            name: "Participants",
            value:
              `Sender: <@${tradeOptions.sender}>\n` +
              `Receiver: <@${tradeOptions.receiver}>`,
          }
        )
        .setTimestamp();

      // Create final confirmation buttons
      const confirmButton = new ButtonBuilder()
        .setCustomId("final_confirm")
        .setLabel("Confirm Transaction Details")
        .setStyle(ButtonStyle.Success);

      const cancelButton = new ButtonBuilder()
        .setCustomId("cancel_transaction")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(
        confirmButton,
        cancelButton
      );

      await interaction.channel.send({
        embeds: [finalSummaryEmbed],
        components: [row],
      });

      // Clean up fee selection buttons
      try {
        const messageId = interaction.message.id;
        const channel = interaction.channel;

        // Fetch the message to ensure it exists
        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);

        if (message) {
          await message.delete();
          console.log(`Deleted message with ID: ${messageId}`);
        } else {
          console.log(`Message with ID: ${messageId} not found.`);
        }
      } catch (error) {
        console.error(`Error deleting fee selection message: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("Error in handleFeeSelection:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content:
          "An error occurred while processing the fee selection. Please try again.",
        ephemeral: true,
      });
    }
  }
}

async function handleAmountConfirmation(interaction, state) {
  try {
    const tradeOptions = state.getTradeOptions(interaction.channel.id);

    await interaction.reply({
      content: "Processing your confirmation...",
      ephemeral: true,
    });

    if (!tradeOptions.amount) {
      return await interaction.editReply({
        content: "No amount has been set to confirm.",
        ephemeral: true,
      });
    }

    // Verify user is part of the trade
    if (
      interaction.user.id !== tradeOptions.sender &&
      interaction.user.id !== tradeOptions.receiver
    ) {
      return await interaction.editReply({
        content: "Only the sender or receiver can confirm the amount.",
        ephemeral: true,
      });
    }

    const cryptoType = state.getCrypto(interaction.channel.id);
    const result = await getTokenPrice(cryptoType);
    const tokenPrice = result.price;
    const usdAmount = tradeOptions.amount * tokenPrice;

    // Update amount confirmation status
    if (interaction.user.id === tradeOptions.sender) {
      tradeOptions.senderAmountConfirmed = true;
    } else {
      tradeOptions.receiverAmountConfirmed = true;
    }

    state.setTradeOptions(interaction.channel.id, tradeOptions);

    const confirmEmbed = new EmbedBuilder()
      .setColor("#00FF00")
      .setTitle("Amount Confirmation")
      .setDescription(
        `<@${interaction.user.id}> has confirmed the transaction amount.`
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [confirmEmbed] });

    if (
      tradeOptions.senderAmountConfirmed &&
      tradeOptions.receiverAmountConfirmed
    ) {
      if (usdAmount < 50) {
        tradeOptions.feePaymentOption = "none";
        tradeOptions.fee = 0;
        tradeOptions.senderPays = tradeOptions.amount;
        tradeOptions.receiverGets = tradeOptions.amount;
        state.setTradeOptions(interaction.channel.id, tradeOptions);

        const noFeeEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("Transaction Summary (No Fee)")
          .setDescription("Amount is less than $50, no fee will be applied.")
          .addFields(
            {
              name: "Amount",
              value: `${tradeOptions.amount} ${cryptoType}`,
              inline: true,
            },
            {
              name: "USD Value",
              value: `$${usdAmount.toFixed(2)}`,
              inline: true,
            },
            { name: "Token Price", value: `$${tokenPrice}`, inline: true },
            { name: "Fee", value: "No fee (amount < $50)" },
            {
              name: "Final Amount",
              value:
                `💰 Sender Pays: ${
                  tradeOptions.amount
                } ${cryptoType} ($${usdAmount.toFixed(2)})\n` +
                `📥 Receiver Gets: ${
                  tradeOptions.amount
                } ${cryptoType} ($${usdAmount.toFixed(2)})`,
            },
            {
              name: "Participants",
              value:
                `Sender: <@${tradeOptions.sender}>\n` +
                `Receiver: <@${tradeOptions.receiver}>`,
            }
          )
          .setTimestamp();

        const confirmButton = new ButtonBuilder()
          .setCustomId("final_confirm")
          .setLabel("Confirm Transaction Details")
          .setStyle(ButtonStyle.Success);

        const cancelButton = new ButtonBuilder()
          .setCustomId("cancel_transaction")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(
          confirmButton,
          cancelButton
        );

        await interaction.channel.send({
          embeds: [noFeeEmbed],
          components: [row],
        });
      } else {
        let fee = "";
        if (usdAmount >= 50) {
          fee = "1%";
        } else if (usdAmount >= 250) {
          fee = "$2";
        }
        // Create fee selection buttons for amounts >= $50
        const senderFeeButton = new ButtonBuilder()
          .setCustomId("fee_sender")
          .setLabel("Sender Pays Fee")
          .setStyle(ButtonStyle.Primary);

        const receiverFeeButton = new ButtonBuilder()
          .setCustomId("fee_receiver")
          .setLabel("Receiver Pays Fee")
          .setStyle(ButtonStyle.Primary);

        const splitFeeButton = new ButtonBuilder()
          .setCustomId("fee_split")
          .setLabel("Split Fee")
          .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
          .setCustomId("cancel_amount")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(
          senderFeeButton,
          receiverFeeButton,
          splitFeeButton,
          cancelButton
        );

        const initialSummaryEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("Initial Transaction Summary")
          .setDescription(
            "Both parties have confirmed the amount. Please select the fee payment option."
          )
          .addFields(
            {
              name: "Base Amount",
              value: `${tradeOptions.amount} ${cryptoType}`,
              inline: true,
            },
            {
              name: "USD Value",
              value: `$${usdAmount.toFixed(2)}`,
              inline: true,
            },
            { name: "Token Price", value: `$${tokenPrice}`, inline: true },
            { name: "Fee Rate", value: fee },
            {
              name: "Participants",
              value:
                `Sender: <@${tradeOptions.sender}>\n` +
                `Receiver: <@${tradeOptions.receiver}>`,
            }
          )
          .setTimestamp();

        await interaction.channel.send({
          embeds: [initialSummaryEmbed],
          components: [row],
        });
      }

      try {
        const messages = await interaction.channel.messages.fetch({
          limit: 10,
        });
        const confirmMsg = messages.find(
          (msg) =>
            msg.components?.length > 0 &&
            msg.components[0].components.some(
              (c) =>
                c.customId === "confirm_amount" ||
                c.customId === "cancel_amount"
            )
        );
        if (confirmMsg) {
          await confirmMsg.delete();
        }
      } catch (error) {
        console.error("Error deleting confirmation message:", error);
      }
    } else {
      // Update the reply to show waiting for other party
      await interaction.editReply({
        content:
          "Your confirmation has been recorded. Waiting for the other party to confirm...",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Error in handleAmountConfirmation:", error);
    if (!interaction.replied) {
      await interaction.reply({
        content:
          "An error occurred while confirming the amount. Please try again.",
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content:
          "An error occurred while confirming the amount. Please try again.",
        ephemeral: true,
      });
    }
  }
}

const handleWalletModal = async (interaction, state) => {
  const walletAddress = interaction.fields.getTextInputValue("wallet_input");
  const tradeOptions = state.getTradeOptions(interaction.channel.id);
  tradeOptions.senderWalletAddress = walletAddress;
  state.setTradeOptions(interaction.channel.id, tradeOptions);

  const warningEmbed = new EmbedBuilder()
    .setColor("#FFA500")
    .setTitle("⚠️ Wallet Address(Receiver) Confirmation")
    .setDescription("Please verify your wallet address carefully!")
    .addFields(
      {
        name: "Entered Wallet Address",
        value: walletAddress,
      },
      {
        name: "⚠️ Important Warning",
        value:
          "Putting the wrong sender address can result to a loss of funds! If we can not recover it, then we are not responsible.",
      }
    )
    .setTimestamp();

  const confirmButton = new ButtonBuilder()
    .setCustomId("confirm_sender_wallet")
    .setLabel("Confirm Address")
    .setStyle(ButtonStyle.Success);

  const editButton = new ButtonBuilder()
    .setCustomId("edit_sender_wallet")
    .setLabel("Edit Address")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(confirmButton, editButton);

  await interaction.reply({
    embeds: [warningEmbed],
    components: [row],
  });
}

module.exports = buttonHandlers;
