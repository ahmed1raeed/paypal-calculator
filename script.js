document.addEventListener('DOMContentLoaded', () => {
  // العناصر الأساسية
  const form = document.getElementById('calculator-form');
  const amountInput = document.getElementById('amount-input');
  const calculateBtn = document.getElementById('calculate-btn');
  const presetChips = document.querySelectorAll('.preset-chip');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // عناصر واجهة النتائج والنصوص
  const displayNet = document.getElementById('display-net');
  const displayAmount = document.getElementById('display-amount');
  const displayFee = document.getElementById('display-fee');
  const displayTotal = document.getElementById('display-total');

  const heroLabel = document.getElementById('hero-label');
  const labelAmount = document.getElementById('label-amount');
  const labelTotal = document.getElementById('label-total');
  const rateBadge = document.getElementById('rate-badge');
  const modeDescription = document.getElementById('mode-description');

  let currentMode = 'commercial';

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // إدارة تحديد الأزرار السريعة
  function updateActiveChip(val) {
    const numericVal = parseFloat(val);
    presetChips.forEach(chip => {
      const chipAmount = parseFloat(chip.dataset.amount || chip.textContent.replace(/[^0-9.]/g, ''));
      if (chipAmount === numericVal) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  // حساب الحالات
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

    if (currentMode === 'commercial') {
      // 1. Goods & Services: 3.4% + $0.30
      const fee = (amount * 0.034) + 0.30;
      const net = Math.max(0, amount - fee);
      const toAskFor = (amount + 0.30) / (1 - 0.034);

      if (heroLabel) heroLabel.textContent = 'Recipient Receives';
      if (labelAmount) labelAmount.textContent = 'Gross Transaction';
      if (labelTotal) labelTotal.textContent = 'Send To Cover Fees';
      if (rateBadge) rateBadge.textContent = 'Rate: 3.4% + $0.30';
      if (modeDescription) modeDescription.textContent = 'Standard merchant rate. Fee deducted from seller.';

      if (displayNet) displayNet.textContent = currencyFormatter.format(net);
      if (displayAmount) displayAmount.textContent = currencyFormatter.format(amount);
      if (displayFee) displayFee.textContent = '-' + currencyFormatter.format(fee);
      if (displayTotal) displayTotal.textContent = currencyFormatter.format(toAskFor);

    } else {
      // 2. Personal (Card / Int. Transfer): Card fee 2.99% + $0.49 + Int. Fee (min $0.79-$0.99)
      const cardFee = (amount * 0.0299) + 0.49;
      const intlFee = Math.max(0.79, amount * 0.05);
      const totalFee = cardFee + intlFee;
      const totalCharged = amount + totalFee;

      if (heroLabel) heroLabel.textContent = 'Friend Receives';
      if (labelAmount) labelAmount.textContent = 'Amount You Send';
      if (labelTotal) labelTotal.textContent = 'Total Pulled From Your Card';
      if (rateBadge) rateBadge.textContent = 'Card & Transfer Rates';
      if (modeDescription) modeDescription.textContent = 'Debit/Credit card personal transfer. Sender covers fee.';

      if (displayNet) displayNet.textContent = currencyFormatter.format(amount);
      if (displayAmount) displayAmount.textContent = currencyFormatter.format(amount);
      if (displayFee) displayFee.textContent = '+' + currencyFormatter.format(totalFee);
      if (displayTotal) displayTotal.textContent = currencyFormatter.format(totalCharged);
    }
  }

  // التبديل بين التبويبات
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      calculate();
    });
  });

  // أحداث الأزرار السريعة
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.amount || chip.textContent.replace(/[^0-9.]/g, '').trim();
      if (amountInput) {
        amountInput.value = parseFloat(val).toFixed(2);
        updateActiveChip(val);
        calculate();
      }
    });
  });

  // كتابة المبلغ يدوياً
  if (amountInput) {
    amountInput.addEventListener('input', () => {
      updateActiveChip(amountInput.value);
      calculate();
    });
  }

  // زر الحساب و Enter
  if (calculateBtn) {
    calculateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      calculate();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate();
    });
  }

  // فحص القيمة المبدئية وتشغيل الحسبة
  updateActiveChip(amountInput ? amountInput.value : 100);
  calculate();
});