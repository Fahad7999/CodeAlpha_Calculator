/**
 * Calculator — script.js
 * Operations: +, −, ×, ÷  |  Keyboard support  |  Expression trail display
 */

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  current:      '0',      // number currently shown on display
  previous:     null,     // number before operator was pressed
  operator:     null,     // pending operator symbol
  justEvaled:   false,    // true right after = is pressed
  expression:   '',       // full expression shown above display
};

// ─── DOM References ───────────────────────────────────────────────────────────

const resultEl     = document.getElementById('result');
const expressionEl = document.getElementById('expression');
const clearBtn     = document.getElementById('clearBtn');
const opButtons    = document.querySelectorAll('.btn--op');

// ─── Display Helpers ─────────────────────────────────────────────────────────

/**
 * Render a number string, trimming unnecessary trailing zeros
 * and applying font-size class based on length.
 */
function updateDisplay(value) {
  const str = String(value);
  resultEl.textContent = str;
  resultEl.classList.remove('small', 'xsmall', 'error');

  if (str.length > 12) {
    resultEl.classList.add('xsmall');
  } else if (str.length > 9) {
    resultEl.classList.add('small');
  }
}

function updateExpression(expr) {
  expressionEl.textContent = expr || '\u00A0';
}

/** Highlight the active operator button */
function highlightOperator(op) {
  opButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === op);
  });
}

/** Switch AC label to C when user has typed something */
function updateClearLabel() {
  clearBtn.textContent = (state.current !== '0' && !state.justEvaled)
    ? 'C'
    : 'AC';
}

// ─── Calculation ─────────────────────────────────────────────────────────────

function calculate(a, operator, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);

  switch (operator) {
    case '+': return numA + numB;
    case '−': return numA - numB;
    case '×': return numA * numB;
    case '÷':
      if (numB === 0) return 'Error';
      return numA / numB;
    default:  return numB;
  }
}

/** Format a number result: handle floats, large/small numbers, and errors */
function formatResult(value) {
  if (value === 'Error') return 'Error';

  // Avoid floating point noise (e.g. 0.1 + 0.2 = 0.30000000000000004)
  const rounded = parseFloat(value.toPrecision(12));

  // Use exponential for very large/small numbers
  if (Math.abs(rounded) > 1e12 || (Math.abs(rounded) < 1e-7 && rounded !== 0)) {
    return rounded.toExponential(4);
  }

  return String(rounded);
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

function handleNumber(digit) {
  // After evaluation, start fresh
  if (state.justEvaled) {
    state.current    = digit;
    state.justEvaled = false;
  } else if (state.current === '0') {
    state.current = digit;
  } else if (state.current.length < 15) {
    state.current += digit;
  }

  updateDisplay(state.current);
  updateClearLabel();
}

function handleDecimal() {
  if (state.justEvaled) {
    state.current    = '0.';
    state.justEvaled = false;
  } else if (!state.current.includes('.')) {
    state.current += '.';
  }
  updateDisplay(state.current);
}

function handleOperator(op) {
  state.justEvaled = false;

  // Chain: evaluate previous pending operation first
  if (state.operator && state.previous !== null) {
    const result = calculate(state.previous, state.operator, state.current);
    if (result === 'Error') {
      showError();
      return;
    }
    state.previous = formatResult(result);
    state.current  = state.previous;
    updateDisplay(state.current);
  } else {
    state.previous = state.current;
  }

  state.operator = op;
  state.expression = `${state.previous} ${op}`;
  updateExpression(state.expression);
  highlightOperator(op);

  // Next number input will replace current display
  state.current = '0';
  updateClearLabel();
}

function handleEquals() {
  if (!state.operator || state.previous === null) return;

  const a   = state.previous;
  const op  = state.operator;
  const b   = state.current;
  const result = calculate(a, op, b);

  // Build expression trail
  const exprStr = `${a} ${op} ${b} =`;
  updateExpression(exprStr);

  if (result === 'Error') {
    showError();
    return;
  }

  const formatted = formatResult(result);
  state.current    = formatted;
  state.previous   = null;
  state.operator   = null;
  state.justEvaled = true;

  updateDisplay(formatted);
  highlightOperator(null);
  updateClearLabel();
}

function handleClear() {
  // 'C' clears only current entry; 'AC' resets everything
  if (clearBtn.textContent === 'C') {
    state.current = '0';
    updateDisplay('0');
    updateClearLabel();
  } else {
    fullReset();
  }
}

function handleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  updateDisplay(state.current);
}

function handlePercent() {
  if (state.current === 'Error') return;
  const val = parseFloat(state.current) / 100;
  state.current = String(parseFloat(val.toPrecision(12)));
  updateDisplay(state.current);
}

function fullReset() {
  state.current    = '0';
  state.previous   = null;
  state.operator   = null;
  state.justEvaled = false;
  state.expression = '';

  updateDisplay('0');
  updateExpression('');
  highlightOperator(null);
  clearBtn.textContent = 'AC';
}

function showError() {
  state.current    = 'Error';
  state.previous   = null;
  state.operator   = null;
  state.justEvaled = true;

  resultEl.textContent = 'Error';
  resultEl.classList.add('error');
  updateExpression('Division by zero');
  highlightOperator(null);
  clearBtn.textContent = 'AC';
}

// ─── Button Click Routing ────────────────────────────────────────────────────

document.querySelector('.buttons').addEventListener('click', (e) => {
  const btn = e.target.closest('.btn');
  if (!btn) return;

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'number':   handleNumber(value);   break;
    case 'operator': handleOperator(value); break;
    case 'equals':   handleEquals();        break;
    case 'clear':    handleClear();         break;
    case 'sign':     handleSign();          break;
    case 'percent':  handlePercent();       break;
    case 'decimal':  handleDecimal();       break;
  }
});

// ─── Keyboard Support ────────────────────────────────────────────────────────

const KEY_MAP = {
  '0': () => handleNumber('0'),
  '1': () => handleNumber('1'),
  '2': () => handleNumber('2'),
  '3': () => handleNumber('3'),
  '4': () => handleNumber('4'),
  '5': () => handleNumber('5'),
  '6': () => handleNumber('6'),
  '7': () => handleNumber('7'),
  '8': () => handleNumber('8'),
  '9': () => handleNumber('9'),
  '.': () => handleDecimal(),
  ',': () => handleDecimal(),
  '+': () => handleOperator('+'),
  '-': () => handleOperator('−'),
  '*': () => handleOperator('×'),
  '/': () => handleOperator('÷'),
  'Enter':     () => handleEquals(),
  '=':         () => handleEquals(),
  'Backspace': () => {
    if (state.current.length > 1 && !state.justEvaled) {
      state.current = state.current.slice(0, -1) || '0';
    } else {
      state.current = '0';
    }
    updateDisplay(state.current);
    updateClearLabel();
  },
  'Escape': () => fullReset(),
  '%':      () => handlePercent(),
};

document.addEventListener('keydown', (e) => {
  // Don't hijack browser shortcuts
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const handler = KEY_MAP[e.key];
  if (handler) {
    e.preventDefault();
    handler();

    // Visual feedback: briefly highlight the matching button
    const selector = e.key === 'Enter' || e.key === '='
      ? '[data-action="equals"]'
      : e.key === 'Backspace'
      ? '[data-action="clear"]'
      : `[data-value="${e.key}"]`;

    const matchedBtn = document.querySelector(selector);
    if (matchedBtn) {
      matchedBtn.style.filter = 'brightness(1.4)';
      setTimeout(() => { matchedBtn.style.filter = ''; }, 120);
    }
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
updateDisplay('0');
updateExpression('');