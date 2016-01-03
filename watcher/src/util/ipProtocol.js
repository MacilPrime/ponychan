/* @flow */
//jshint ignore:start

export default function ipProtocol(ip: string): number {
  if (/^(\d+\.){3}\d+$/.test(ip)) {
    return 4;
  }
  if (/:/i.test(ip)) {
    return 6;
  }
  throw new Error("Invalid IP address");
}
