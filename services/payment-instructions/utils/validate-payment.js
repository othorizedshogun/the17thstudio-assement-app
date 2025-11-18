const PaymentInstructionMessages = require('@app/messages/payment-instructions');

const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'GHS'];

/**
 * Validates account ID format (alphanumeric, hyphens, periods, @ symbols)
 */
function isValidAccountId(accountId) {
  if (!accountId || typeof accountId !== 'string') {
    return false;
  }

  for (let i = 0; i < accountId.length; i++) {
    const char = accountId[i];
    const isAlphanumeric =
      (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9');
    const isAllowedSpecial = char === '-' || char === '.' || char === '@';

    if (!isAlphanumeric && !isAllowedSpecial) {
      return false;
    }
  }

  return accountId.length > 0;
}

/**
 * Validates date format (YYYY-MM-DD)
 */
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  if (dateStr.length !== 10) {
    return false;
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return false;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }

  if (year < 1000 || year > 9999) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  const date = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const dateYear = date.getUTCFullYear();
  const dateMonth = date.getUTCMonth() + 1;
  const dateDay = date.getUTCDate();

  return dateYear === year && dateMonth === month && dateDay === day;
}

/**
 * Validates parsed payment instruction data and returns validation result
 *
 * @param {Object} parsed - Parsed instruction object
 * @param {Array} accounts - Array of account objects from request
 * @returns {Object|null} Validation error object with status_code and status_reason, or null if valid
 */
function validatePayment(parsed, accounts) {
  if (parsed.amount === null || parsed.amount === undefined) {
    return {
      status_code: 'AM01',
      status_reason: PaymentInstructionMessages.INVALID_AMOUNT,
    };
  }

  if (typeof parsed.amount !== 'number' || parsed.amount <= 0 || !Number.isInteger(parsed.amount)) {
    return {
      status_code: 'AM01',
      status_reason: PaymentInstructionMessages.INVALID_AMOUNT,
    };
  }

  if (!parsed.currency || typeof parsed.currency !== 'string') {
    return {
      status_code: 'CU02',
      status_reason: PaymentInstructionMessages.UNSUPPORTED_CURRENCY,
    };
  }

  const currencyUpper = parsed.currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currencyUpper)) {
    return {
      status_code: 'CU02',
      status_reason: PaymentInstructionMessages.UNSUPPORTED_CURRENCY,
    };
  }

  if (!parsed.debit_account || !parsed.credit_account) {
    return {
      status_code: 'AC03',
      status_reason: PaymentInstructionMessages.ACCOUNT_NOT_FOUND,
    };
  }

  if (!isValidAccountId(parsed.debit_account)) {
    return {
      status_code: 'AC04',
      status_reason: PaymentInstructionMessages.INVALID_ACCOUNT_ID_FORMAT,
    };
  }

  if (!isValidAccountId(parsed.credit_account)) {
    return {
      status_code: 'AC04',
      status_reason: PaymentInstructionMessages.INVALID_ACCOUNT_ID_FORMAT,
    };
  }

  if (parsed.debit_account === parsed.credit_account) {
    return {
      status_code: 'AC02',
      status_reason: PaymentInstructionMessages.SAME_ACCOUNT_ERROR,
    };
  }

  const debitAccount = accounts.find((acc) => acc.id === parsed.debit_account);
  const creditAccount = accounts.find((acc) => acc.id === parsed.credit_account);

  if (!debitAccount) {
    return {
      status_code: 'AC03',
      status_reason: PaymentInstructionMessages.ACCOUNT_NOT_FOUND,
    };
  }

  if (!creditAccount) {
    return {
      status_code: 'AC03',
      status_reason: PaymentInstructionMessages.ACCOUNT_NOT_FOUND,
    };
  }

  const debitCurrency = debitAccount.currency ? debitAccount.currency.toUpperCase() : null;
  const creditCurrency = creditAccount.currency ? creditAccount.currency.toUpperCase() : null;

  if (debitCurrency !== currencyUpper || creditCurrency !== currencyUpper) {
    return {
      status_code: 'CU01',
      status_reason: PaymentInstructionMessages.CURRENCY_MISMATCH,
    };
  }

  if (debitAccount.balance < parsed.amount) {
    return {
      status_code: 'AC01',
      status_reason: PaymentInstructionMessages.INSUFFICIENT_FUNDS,
    };
  }

  if (parsed.execute_by !== null && parsed.execute_by !== undefined) {
    if (!isValidDateFormat(parsed.execute_by)) {
      return {
        status_code: 'DT01',
        status_reason: PaymentInstructionMessages.INVALID_DATE_FORMAT,
      };
    }
  }

  return null;
}

module.exports = validatePayment;
