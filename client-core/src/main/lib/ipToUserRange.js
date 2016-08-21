/* @flow */

export default function ipToUserRange(ip: string): string {
  return ip.replace(/^((?:[0-9a-f]+:){4}).*/, '$1*');
}
