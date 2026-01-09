export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDateRelative = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  if (diffDays === 1) return 'Hoje';
  if (diffDays === 2) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  return new Intl.DateTimeFormat('pt-BR').format(date);
};