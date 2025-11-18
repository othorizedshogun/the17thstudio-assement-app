module.exports = {
  // Parsing errors
  MALFORMED_INSTRUCTION: 'Malformed instruction: unable to parse keywords',
  MISSING_REQUIRED_KEYWORD: 'Missing required keyword',
  INVALID_KEYWORD_ORDER: 'Invalid keyword order',

  // Amount validation
  INVALID_AMOUNT: 'Amount must be a positive integer',
  NEGATIVE_AMOUNT: 'Amount must be a positive integer',
  DECIMAL_AMOUNT: 'Amount must be a positive integer (no decimals)',

  // Currency validation
  UNSUPPORTED_CURRENCY: 'Unsupported currency. Only NGN, USD, GBP, and GHS are supported',
  CURRENCY_MISMATCH: 'Account currency mismatch',

  // Account validation
  INSUFFICIENT_FUNDS: 'Insufficient funds in debit account',
  SAME_ACCOUNT_ERROR: 'Debit and credit accounts cannot be the same',
  ACCOUNT_NOT_FOUND: 'Account not found',
  INVALID_ACCOUNT_ID_FORMAT: 'Invalid account ID format',

  // Date validation
  INVALID_DATE_FORMAT: 'Invalid date format. Expected YYYY-MM-DD',

  // Success messages
  TRANSACTION_EXECUTED: 'Transaction executed successfully',
  TRANSACTION_PENDING: 'Transaction scheduled for future execution',
};
