export const formatNum = (n) => {
  if (n == null) return '0';
  n = Number(n);
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
};

export const shortenAddr = (a) =>
  a ? a.slice(0, 6) + '...' + a.slice(-4) : '—';

export const formatPct = (n, decimals = 4) =>
  n != null ? Number(n).toFixed(decimals) + '%' : '0%';

export const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};
