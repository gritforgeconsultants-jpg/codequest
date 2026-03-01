/** Format XP number (e.g. 1250 → "1,250") */
export function fmtXP(n) {
  return Number(n).toLocaleString();
}

/** Get today's date as YYYY-MM-DD in local time */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Get yesterday's date as YYYY-MM-DD in local time */
export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Format a percentage 0–1 as "42%" */
export function fmtPct(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

/** Pluralize: fmtN(1,'lesson') → "1 lesson", fmtN(3,'lesson') → "3 lessons" */
export function fmtN(n, word) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`;
}

/** Trim and normalize expected output for test comparison */
export function normalizeOutput(str) {
  return String(str ?? '').trim().replace(/\r\n/g, '\n');
}
