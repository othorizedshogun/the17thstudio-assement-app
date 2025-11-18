const validator = require('@app-core/validator');
const { appLogger } = require('@app-core/logger');
const PaymentInstructionMessages = require('@app/messages/payment-instructions');
const parseInstruction = require('./utils/parse-instruction');
const validatePayment = require('./utils/validate-payment');
const executeTransaction = require('./utils/execute-transaction');

const spec = `root {
  accounts[] {
    id string<minLength:1>
    balance number<min:0>
    currency string<length:3|uppercase>
  }
  instruction string<trim|minLength:1>
}`;

const parsedSpec = validator.parse(spec);

/**
 * Gets accounts with balance_before for error responses.
 * Maintains order from original accounts array.
 *
 * @param {Array} accounts - Original accounts array
 * @param {string} debitAccountId - Debit account ID
 * @param {string} creditAccountId - Credit account ID
 * @returns {Array} Accounts with balance_before
 */
function getAccountsWithBalanceBefore(accounts, debitAccountId, creditAccountId) {
  const result = [];
  accounts.forEach((acc) => {
    if (acc.id === debitAccountId || acc.id === creditAccountId) {
      result.push({
        id: acc.id,
        balance: acc.balance,
        balance_before: acc.balance,
        currency: acc.currency ? acc.currency.toUpperCase() : acc.currency,
      });
    }
  });
  return result;
}

/**
 * Processes a payment instruction by parsing, validating, and executing it.
 *
 * @param {Object} serviceData - Service data containing accounts and instruction
 * @param {Object} _options - Optional service options
 * @returns {Object} Response object with transaction details and status
 */
async function processPaymentInstruction(serviceData, _options = {}) {
  let result;

  try {
    const data = validator.validate(serviceData, parsedSpec);

    const instructionLower = data.instruction.trim().toLowerCase();
    const hasDebit = instructionLower.indexOf('debit') === 0;
    const hasCredit = instructionLower.indexOf('credit') === 0;

    if (!hasDebit && !hasCredit) {
      result = {
        type: null,
        amount: null,
        currency: null,
        debit_account: null,
        credit_account: null,
        execute_by: null,
        status: 'failed',
        status_reason: PaymentInstructionMessages.MISSING_REQUIRED_KEYWORD,
        status_code: 'SY01',
        accounts: [],
      };
      return result;
    }

    const parsed = parseInstruction(data.instruction);

    if (!parsed) {
      result = {
        type: null,
        amount: null,
        currency: null,
        debit_account: null,
        credit_account: null,
        execute_by: null,
        status: 'failed',
        status_reason: PaymentInstructionMessages.MALFORMED_INSTRUCTION,
        status_code: 'SY03',
        accounts: [],
      };
      return result;
    }

    const validationError = validatePayment(parsed, data.accounts);

    if (validationError) {
      result = {
        type: parsed.type,
        amount: parsed.amount,
        currency: parsed.currency,
        debit_account: parsed.debit_account,
        credit_account: parsed.credit_account,
        execute_by: parsed.execute_by,
        status: 'failed',
        status_reason: validationError.status_reason,
        status_code: validationError.status_code,
        accounts: getAccountsWithBalanceBefore(
          data.accounts,
          parsed.debit_account,
          parsed.credit_account
        ),
      };
      return result;
    }

    const executionResult = executeTransaction(parsed, data.accounts);

    result = {
      type: parsed.type,
      amount: parsed.amount,
      currency: parsed.currency,
      debit_account: parsed.debit_account,
      credit_account: parsed.credit_account,
      execute_by: parsed.execute_by,
      status: executionResult.status,
      status_reason: executionResult.status_reason,
      status_code: executionResult.status_code,
      accounts: executionResult.accounts,
    };
  } catch (error) {
    appLogger.errorX({ error, serviceData }, 'process-payment-instruction-error');
    throw error;
  }

  return result;
}

module.exports = processPaymentInstruction;
