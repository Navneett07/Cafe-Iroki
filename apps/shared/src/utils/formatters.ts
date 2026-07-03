export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const truncate = (str: string, length = 60): string =>
  str.length > length ? `${str.slice(0, length)}…` : str;

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const getOrderStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    received: 'text-blue-400 bg-blue-400/10',
    confirmed: 'text-cyan-400 bg-cyan-400/10',
    preparing: 'text-yellow-400 bg-yellow-400/10',
    ready: 'text-green-400 bg-green-400/10',
    'out-for-delivery': 'text-purple-400 bg-purple-400/10',
    delivered: 'text-emerald-400 bg-emerald-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
    refunded: 'text-orange-400 bg-orange-400/10',
  };
  return map[status] ?? 'text-zinc-400 bg-zinc-400/10';
};

export const getPaymentStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    paid: 'text-emerald-400 bg-emerald-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    failed: 'text-red-400 bg-red-400/10',
    refunded: 'text-orange-400 bg-orange-400/10',
  };
  return map[status] ?? 'text-zinc-400 bg-zinc-400/10';
};
