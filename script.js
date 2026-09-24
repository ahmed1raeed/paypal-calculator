/**
 * PayPal Fee Calculator - Pure Client-side Logic
 * Instant calculation on user input without any backend/API dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('calculator-form');
  const amountInput = document.getElementById('amount-input');
  const calculateBtn = document.getElementById('calculate-btn');
  const presetChips = document.querySelectorAll('.preset-chip');

  // Result Elements
  const displayNet = document.getElementById('display-net');
  const displayAmount = document.getElementById('display-amount');
  const displayFee = document.getElementById('display-fee');
  const displayTotal = document.getElementById('display-total');

  // Currency Formatter
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /**
   * Calculates PayPal fees purely on the client side:
   * Standard Rate: 3.4% + $0.30 fixed fee
   */
  function calculate() {
    const amount = parseFloat(amountInput.value) || 0;

    if (amount <= 0) {
      displayAmount.textContent = '$0.00';
      displayFee.textContent = '$0.00';
      displayNet.textContent = '$0.00';
      displayTotal.textContent = '$0.00';
      return;
    }

    // 1. لو هتبعت/تستلم المبلغ ده: كام هيتخصم منه؟
    const fee = (amount * 0.034) + 0.30;
    const net = Math.max(0, amount - fee);

    // 2. لو عاوز يوصلك المبلغ ده صافي: المفروض العميل يدفع كام؟
    const toReceiveExact = (amount + 0.30) / (1 - 0.034);

    const format = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    displayAmount.textContent = format(amount);
    displayFee.textContent = '-' + format(fee);
    displayNet.textContent = format(net);

    // هنا الناتج اللي تقصده: إجمالي المبلغ المطلوب دفعه عشان يوصلك الصافي
    displayTotal.textContent = format(toReceiveExact);
  }

  // PayPal Standard Fee formula: 3.4% + $0.30
  const fee = Math.round((numericAmount * 0.034 + 0.30) * 100) / 100;
  const net = Math.max(0, Math.round((numericAmount - fee) * 100) / 100);
  const total = numericAmount;

  updateDisplay({
    amount: numericAmount,
    fee: fee,
    total: total,
    net: net
  });
}

  /**
   * Updates the UI display with calculated values
   */
  function updateDisplay(data) {
    if (displayAmount) {
      displayAmount.textContent = currencyFormatter.format(data.amount);
    }
    if (displayFee) {
      displayFee.textContent = data.fee > 0 ? `-${currencyFormatter.format(data.fee)}` : currencyFormatter.format(0);
    }
    if (displayTotal) {
      displayTotal.textContent = currencyFormatter.format(data.total);
    }
    if (displayNet) {
      displayNet.textContent = currencyFormatter.format(data.net);
    }
  }

  /**
   * Synchronizes active state on preset chips based on current input value
   */
  function syncPresetState(value) {
    const num = parseFloat(value);
    presetChips.forEach(chip => {
      const chipAmount = parseFloat(chip.dataset.amount);
      if (chipAmount === num) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // Event Listeners for Real-Time Instant Calculation
  if (amountInput) {
  amountInput.addEventListener('input', () => {
    syncPresetState(amountInput.value);
    calculateFee(amountInput.value);
  });
}

presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const selectedAmount = chip.dataset.amount;
    if (amountInput) {
      amountInput.value = selectedAmount;
    }
    syncPresetState(selectedAmount);
    calculateFee(selectedAmount);
    if (amountInput) {
      amountInput.focus();
    }
  });
});

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (amountInput) {
      calculateFee(amountInput.value);
    }
  });
}

// Initial calculation on page load
if (amountInput && amountInput.value) {
  syncPresetState(amountInput.value);
  calculateFee(amountInput.value);
}
});