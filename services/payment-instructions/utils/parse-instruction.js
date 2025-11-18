/**
 * Parses DEBIT format: DEBIT [amount] [currency] FROM ACCOUNT [id] FOR CREDIT TO ACCOUNT [id] [ON [date]]
 */
function parseDebitFormat(original, lower) {
  const debitPos = lower.indexOf('debit');
  const fromPos = lower.indexOf('from');
  const accountPos1 = lower.indexOf('account', fromPos);
  const forPos = lower.indexOf('for');
  const creditPos = lower.indexOf('credit', forPos);
  const toPos = lower.indexOf('to', creditPos);
  const accountPos2 = lower.indexOf('account', toPos);
  const onPos = accountPos2 !== -1 ? lower.indexOf('on', accountPos2) : -1;

  if (
    debitPos === -1 ||
    fromPos === -1 ||
    accountPos1 === -1 ||
    forPos === -1 ||
    creditPos === -1 ||
    toPos === -1 ||
    accountPos2 === -1
  ) {
    return null;
  }

  if (
    debitPos > fromPos ||
    fromPos > accountPos1 ||
    accountPos1 > forPos ||
    forPos > creditPos ||
    creditPos > toPos ||
    toPos > accountPos2
  ) {
    return null;
  }

  if (onPos !== -1 && onPos < accountPos2) {
    return null;
  }

  const debitEnd = original.toLowerCase().indexOf('debit') + 'debit'.length;
  const fromStart = original.toLowerCase().indexOf('from');
  const amountCurrencyStr = original.substring(debitEnd, fromStart).trim();

  const amountCurrencyParts = amountCurrencyStr.split(' ').filter((part) => part.length > 0);
  if (amountCurrencyParts.length < 2) {
    return null;
  }

  const amountStr = amountCurrencyParts[0];
  const currencyStr = amountCurrencyParts[1];

  let amount;
  if (amountStr.indexOf('.') !== -1) {
    amount = parseFloat(amountStr);
  } else {
    amount = parseInt(amountStr, 10);
  }
  if (Number.isNaN(amount)) {
    return null;
  }

  const account1Start = original.toLowerCase().indexOf('account', fromPos) + 'account'.length;
  const forStart = original.toLowerCase().indexOf('for');
  const debitAccountStr = original.substring(account1Start, forStart).trim();

  const account2Start = original.toLowerCase().indexOf('account', toPos) + 'account'.length;
  let creditAccountEnd;
  if (onPos !== -1 && onPos > account2Start) {
    creditAccountEnd = original.toLowerCase().indexOf('on');
  } else {
    creditAccountEnd = original.length;
  }
  const creditAccountStr = original.substring(account2Start, creditAccountEnd).trim();

  let executeBy = null;
  if (onPos !== -1) {
    const onEnd = original.toLowerCase().indexOf('on') + 'on'.length;
    const dateStr = original.substring(onEnd).trim();
    if (dateStr) {
      executeBy = dateStr;
    }
  }

  return {
    type: 'DEBIT',
    amount,
    currency: currencyStr.toUpperCase(),
    debit_account: debitAccountStr,
    credit_account: creditAccountStr,
    execute_by: executeBy,
  };
}

/**
 * Parses CREDIT format: CREDIT [amount] [currency] TO ACCOUNT [id] FOR DEBIT FROM ACCOUNT [id] [ON [date]]
 */
function parseCreditFormat(original, lower) {
  const creditPos = lower.indexOf('credit');
  const toPos = lower.indexOf('to');
  const accountPos1 = lower.indexOf('account', toPos);
  const forPos = lower.indexOf('for');
  const debitPos = lower.indexOf('debit', forPos);
  const fromPos = lower.indexOf('from', debitPos);
  const accountPos2 = lower.indexOf('account', fromPos);
  const onPos = accountPos2 !== -1 ? lower.indexOf('on', accountPos2) : -1;

  if (
    creditPos === -1 ||
    toPos === -1 ||
    accountPos1 === -1 ||
    forPos === -1 ||
    debitPos === -1 ||
    fromPos === -1 ||
    accountPos2 === -1
  ) {
    return null;
  }

  if (
    creditPos > toPos ||
    toPos > accountPos1 ||
    accountPos1 > forPos ||
    forPos > debitPos ||
    debitPos > fromPos ||
    fromPos > accountPos2
  ) {
    return null;
  }

  if (onPos !== -1 && onPos < accountPos2) {
    return null;
  }

  const creditEnd = original.toLowerCase().indexOf('credit') + 'credit'.length;
  const toStart = original.toLowerCase().indexOf('to');
  const amountCurrencyStr = original.substring(creditEnd, toStart).trim();

  const amountCurrencyParts = amountCurrencyStr.split(' ').filter((part) => part.length > 0);
  if (amountCurrencyParts.length < 2) {
    return null;
  }

  const amountStr = amountCurrencyParts[0];
  const currencyStr = amountCurrencyParts[1];

  let amount;
  if (amountStr.indexOf('.') !== -1) {
    amount = parseFloat(amountStr);
  } else {
    amount = parseInt(amountStr, 10);
  }
  if (Number.isNaN(amount)) {
    return null;
  }

  const account1Start = original.toLowerCase().indexOf('account', toPos) + 'account'.length;
  const forStart = original.toLowerCase().indexOf('for');
  const creditAccountStr = original.substring(account1Start, forStart).trim();

  const account2Start = original.toLowerCase().indexOf('account', fromPos) + 'account'.length;
  let debitAccountEnd;
  if (onPos !== -1 && onPos > account2Start) {
    debitAccountEnd = original.toLowerCase().indexOf('on');
  } else {
    debitAccountEnd = original.length;
  }
  const debitAccountStr = original.substring(account2Start, debitAccountEnd).trim();

  let executeBy = null;
  if (onPos !== -1) {
    const onEnd = original.toLowerCase().indexOf('on') + 'on'.length;
    const dateStr = original.substring(onEnd).trim();
    if (dateStr) {
      executeBy = dateStr;
    }
  }

  return {
    type: 'CREDIT',
    amount,
    currency: currencyStr.toUpperCase(),
    debit_account: debitAccountStr,
    credit_account: creditAccountStr,
    execute_by: executeBy,
  };
}

/**
 * Parses a payment instruction string without using regex.
 * Supports both DEBIT and CREDIT formats.
 *
 * @param {string} instruction - The instruction string to parse
 * @returns {Object|null} Parsed instruction object or null if unparseable
 */
function parseInstruction(instruction) {
  if (!instruction || typeof instruction !== 'string') {
    return null;
  }

  const trimmed = instruction.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  const original = trimmed;

  const isDebit = lower.indexOf('debit') === 0;
  const isCredit = lower.indexOf('credit') === 0;

  if (!isDebit && !isCredit) {
    return null;
  }

  try {
    let result;
    if (isDebit) {
      result = parseDebitFormat(original, lower);
    } else {
      result = parseCreditFormat(original, lower);
    }

    if (
      !result ||
      result.amount === null ||
      result.currency === null ||
      result.debit_account === null ||
      result.credit_account === null
    ) {
      return null;
    }

    return result;
  } catch (error) {
    return null;
  }
}

module.exports = parseInstruction;
