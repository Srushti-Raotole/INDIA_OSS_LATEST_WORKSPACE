export const getNow = (): Date => {
  return new Date();
};

export const getYesterday = (): Date => {
  const now = getNow();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

export const getOneHourAgo = (): Date => {
  const now = getNow();
  const oneHourAgo = new Date(now);
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  return oneHourAgo;
};

/**
 * IST (Asia/Kolkata) formatter
 * Returns: "YYYY-MM-DD HH:mm:ss"
 */
export const formatDateTime = (date: Date): string => {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

