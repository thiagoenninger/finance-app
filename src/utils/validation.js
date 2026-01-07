export const isCpfValid = (value) => {
  const numbers = (value || '').replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numbers)) return false;

  const calcDigit = (digits, factor) => {
    let total = 0;
    for (let i = 0; i < digits.length; i += 1) {
      total += Number(digits[i]) * (factor - i);
    }
    const result = total % 11;
    return result < 2 ? 0 : 11 - result;
  };

  const d1 = calcDigit(numbers.slice(0, 9), 10);
  const d2 = calcDigit(numbers.slice(0, 10), 11);
  return d1 === Number(numbers[9]) && d2 === Number(numbers[10]);
};

export const isCnpjValid = (value) => {
  const numbers = (value || '').replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(numbers)) return false;

  const calcDigit = (digits, weights) => {
    const sum = digits.reduce((total, digit, idx) => total + Number(digit) * weights[idx], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const base = numbers.slice(0, 12).split('');
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(base, weights1);

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calcDigit([...base, String(d1)], weights2);

  return d1 === Number(numbers[12]) && d2 === Number(numbers[13]);
};

