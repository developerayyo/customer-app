export const formatNaira = (value: number | string) => {
  const num = typeof value === 'string' ? Number(value) : value;
  if (!isFinite(num)) return '₦0.00';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num).replace('NGN', '₦');
};