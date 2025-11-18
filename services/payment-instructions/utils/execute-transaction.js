const PaymentInstructionMessages = require('@app/messages/payment-instructions');

/**
 * Determines if a transaction should execute immediately based on the execute_by date.
 * Uses UTC timezone for all comparisons.
 *
 * @param {string|null} executeByDate
 * @returns {boolean}
 */
function shouldExecuteImmediately(executeByDate) {
  if (!executeByDate) {
    return true;
  }

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  const executeDate = new Date(`${executeByDate}T00:00:00Z`);

  return executeDate <= todayUTC;
}

/**
 * Gets accounts in the order they appear in the original accounts array,
 * but only includes the two accounts involved in the transaction.
 *
 * @param {Array} accounts
 * @param {string} debitAccountId
 * @param {string} creditAccountId
 * @returns {Array}
 */
function getOrderedAccounts(accounts, debitAccountId, creditAccountId) {
  const ordered = [];
  const accountMap = new Map();

  accounts.forEach((acc) => {
    accountMap.set(acc.id, { ...acc });
  });

  accounts.forEach((acc) => {
    if (acc.id === debitAccountId || acc.id === creditAccountId) {
      ordered.push(accountMap.get(acc.id));
    }
  });

  return ordered;
}

/**
 * Executes a payment transaction by updating account balances.
 *
 * @param {Object} parsed
 * @param {Array} accounts
 * @returns {Object}
 */
function executeTransaction(parsed, accounts) {
  const executeNow = shouldExecuteImmediately(parsed.execute_by);

  const involvedAccounts = getOrderedAccounts(
    accounts,
    parsed.debit_account,
    parsed.credit_account
  );

  const responseAccounts = involvedAccounts.map((acc) => ({
    id: acc.id,
    balance: acc.balance,
    balance_before: acc.balance,
    currency: acc.currency ? acc.currency.toUpperCase() : acc.currency,
  }));

  if (executeNow) {
    responseAccounts.forEach((acc) => {
      if (acc.id === parsed.debit_account) {
        acc.balance = acc.balance_before - parsed.amount;
      } else if (acc.id === parsed.credit_account) {
        acc.balance = acc.balance_before + parsed.amount;
      }
    });

    return {
      status: 'successful',
      status_code: 'AP00',
      status_reason: PaymentInstructionMessages.TRANSACTION_EXECUTED,
      accounts: responseAccounts,
    };
  }
  return {
    status: 'pending',
    status_code: 'AP02',
    status_reason: PaymentInstructionMessages.TRANSACTION_PENDING,
    accounts: responseAccounts,
  };
}

module.exports = executeTransaction;
