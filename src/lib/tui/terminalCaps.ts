export type TerminalCaps = {
  truecolor: boolean;
  unicode: boolean;
  altBuffer: boolean;
  cols: number;
  rows: number;
};

export function detectTerminalCaps(): TerminalCaps {
  const colorterm = (process.env.COLORTERM ?? '').toLowerCase();
  const term = (process.env.TERM ?? '').toLowerCase();
  const truecolor =
    colorterm === 'truecolor' || colorterm === '24bit' || /truecolor|24bit/.test(term);
  const lang = (process.env.LANG ?? process.env.LC_ALL ?? process.env.LC_CTYPE ?? '').toLowerCase();
  const unicode = lang.includes('utf-8') || lang.includes('utf8');
  return {
    truecolor,
    unicode,
    altBuffer: true,
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
  };
}
