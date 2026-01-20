export function getMonthDateRange(): { startOfMonth: string; endOfMonth: string } {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  return {
    startOfMonth: start.toISOString().slice(0, 10),
    endOfMonth: end.toISOString().slice(0, 10),
  };
}
