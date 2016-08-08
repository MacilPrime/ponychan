/* @flow */

export default function filterModeName(t: number): string {
  switch (t) {
  case 0: return 'Disabled';
  case 1: return 'Audit';
  case 2: return 'Enforce';
  default: return `Unknown(${t})`;
  }
}
