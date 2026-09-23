/**
 * PayPal Fee Calculator - Frontend Client
 * Handles real-time API requests to C++ Crow backend, UI animations, and clipboard actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('calculator-form');
  const amountInput = document.getElementById('amount-input');
  const calculateBtn = document.getElementById('calculate-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnText = document.getElementById('btn-text');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');

  // Result Elements
  const displayFee = document.getElementById('display-fee');
  const displayAmount = document.getElementById('display-amount');
  const displayBreakdownFee = document.getElementById('display-breakdown-fee');
  const displayTotal = document.getElementById('display-total');
  const displayNet = document.getElementById('display-net'); // إضافة عنصر الصافي

  // Preset Chips
  const presetChips = document.querySelectorAll('.preset-chip');

  // State
  let currentCalculation = {
    amount: 100,
    fee: 3.70,
    total: 103.70,
    net: 96.30
  };
  let debounceTimer = null;
  let activeAbortController = null;

  // Currency Formatter
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  /**
   * Updates the UI display with new calculation data
   */
  function updateDisplay(data) {
    currentCalculation = data;
    if (displayFee) displayFee.textContent = currencyFormatter.format(data.fee);
    if (displayAmount) displayAmount.textContent = currencyFormatter.format(data.amount);
    if (displayBreakdownFee) displayBreakdownFee.textContent = currencyFormatter.format(data.fee);
    if (displayTotal) displayTotal.textContent = currencyFormatter.format(data.total);

    // تحديث قيمة المبلغ الصافي في الواجهة
    if (displayNet) {
      const netAmount = data.net !== undefined ? data.net : (data.amount - data.fee);
      displayNet.textContent = currencyFormatter.format(netAmount);
    }
  }

  /**
   * Sends POST request to /api/calculate
   */
  async function calculateFee(amount) {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      updateDisplay({
        amount: 0,
        fee: 0,
        total: 0,
        net: 0
      });
      return;
    }

    // Cancel prior request if still pending
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    // Visual loading state
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    if (calculateBtn) calculateBtn.disabled = true;

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ amount: numericAmount }),
        signal: activeAbortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to calculate fee`);
      }

      const result = await response.json();

      // في حال عدم إرجاع قيمة net من خادم C++، نحسبها محلياً
      if (result.net === undefined) {
        result.net = result.amount - result.fee;
      }

      updateDisplay(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Calculation API Error:', err);
        showToast(err.message || 'Unable to connect to calculation service', true);
      }
    } finally {
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (calculateBtn) calculateBtn.disabled = false;
      activeAbortController = null;
    }
  }

  /**
   * Debounced calculation for typing
   */
  function scheduleCalculation() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      calculateFee(amountInput.value);
    }, 200);
  }

  /**
   * Synchronizes active state on preset chips
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

  /**
   * Shows toast notification
   */
  let toastTimer = null;
  function showToast(message, isError = false) {
    if (!toast || !toastMessage) return;
    clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.style.backgroundColor = isError ? 'var(--color-danger)' : 'var(--color-primary-dark)';
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Event Listeners

  if (amountInput) {
    amountInput.addEventListener('input', () => {
      syncPresetState(amountInput.value);
      scheduleCalculation();
    });
  }

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const selectedAmount = chip.dataset.amount;
      amountInput.value = selectedAmount;
      syncPresetState(selectedAmount);
      calculateFee(selectedAmount);
      amountInput.focus();
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearTimeout(debounceTimer);
      calculateFee(amountInput.value);
    });
  }

  // Initial calculation on load
  if (amountInput) {
    calculateFee(amountInput.value);
  }
});