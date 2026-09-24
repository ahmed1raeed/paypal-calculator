document.addEventListener('DOMContentLoaded', () => {
  // جلب العناصر بالمعرفات الأصلية للصفحة
  const form = document.getElementById('calculator-form');
  const amountInput = document.getElementById('amount-input');
  const calculateBtn = document.getElementById('calculate-btn');
  const presetChips = document.querySelectorAll('.preset-chip');

  const displayNet = document.getElementById('display-net');
  const displayAmount = document.getElementById('display-amount');
  const displayFee = document.getElementById('display-fee');
  const displayTotal = document.getElementById('display-total');

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function calculate() {
    if (!amountInput) return;
    const amount = parseFloat(amountInput.value) || 0;

    if (amount <= 0) {
      if (displayNet) displayNet.textContent = '$0.00';
      if (displayAmount) displayAmount.textContent = '$0.00';
      if (displayFee) displayFee.textContent = '$0.00';
      if (displayTotal) displayTotal.textContent = '$0.00';
      return;
    }

    // 1. لو استلمت المبلغ ده: الصافي والعمولة
    const fee = (amount * 0.034) + 0.30;
    const net = Math.max(0, amount - fee);

    // 2. لو عاوز يوصلك المبلغ ده صافي بالظبط: العميل يدفع كام؟
    const toReceiveExact = (amount + 0.30) / (1 - 0.034);

    if (displayNet) displayNet.textContent = currencyFormatter.format(net);
    if (displayAmount) displayAmount.textContent = currencyFormatter.format(amount);
    if (displayFee) displayFee.textContent = '-' + currencyFormatter.format(fee);
    if (displayTotal) displayTotal.textContent = currencyFormatter.format(toReceiveExact);
  }

  // تفعيل التحديث المباشر أثناء الكتابة
  if (amountInput) {
    amountInput.addEventListener('input', calculate);
  }

  // تفعيل زر الحساب الرئيسي
  if (calculateBtn) {
    calculateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculate();
    });
  }

  // تفعيل الفورم عند الضغط على Enter
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate();
    });
  }

  // تفعيل أزرار الأرقام السريعة ($10, $50, $100...)
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.textContent.replace('$', '').trim();
      if (amountInput) {
        amountInput.value = val;
        calculate();
      }
    });
  });

  // تشغيل الحسبة عند التحميل الأولي
  calculate();
});