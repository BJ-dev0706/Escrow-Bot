const { getTokenPrice } = require('./TokenPrice');


const calculateFee = (amount) => {
  if (amount < 50) return 0;
  if (amount < 250) return 2;
  return amount * 0.01;
};


const calculateAmountsInUSD = async (cryptoAmount, cryptoType, feePaymentOption) => {
  try {
    const priceData = await getTokenPrice(cryptoType);
    if (!priceData || !priceData.price) {
      throw new Error('Unable to fetch token price');
    }

    const tokenPrice = Number(priceData.price);
    const usdAmount = cryptoAmount * tokenPrice;
    const fee = calculateFee(usdAmount);
    let senderPays, receiverGets;

    switch (feePaymentOption.toLowerCase()) {
      case 'sender':
        senderPays = cryptoAmount + (fee / tokenPrice);
        receiverGets = cryptoAmount;
        break;
      case 'receiver':
        senderPays = cryptoAmount;
        receiverGets = cryptoAmount - (fee / tokenPrice);
        break;
      case 'split':
        const halfFee = fee / tokenPrice / 2;
        senderPays = cryptoAmount + halfFee;
        receiverGets = cryptoAmount - halfFee;
        break;
      default:
        throw new Error('Invalid fee payment option');
    }

    return {
      senderPays: Number(senderPays.toFixed(8)),
      receiverGets: Number(receiverGets.toFixed(8)),
      fee: Number(fee.toFixed(2)),
      usdAmount: Number(usdAmount.toFixed(2)),
      tokenPrice: Number(tokenPrice.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating amounts:', error);
    throw new Error(error.message || 'Failed to calculate cryptocurrency conversion');
  }
};



module.exports = { calculateFee, calculateAmountsInUSD }