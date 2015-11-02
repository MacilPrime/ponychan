/* @flow */
//jshint ignore:start

const fs = require('fs');
const crypto = require('crypto');
const readline: Object = require('readline');

main();

async function main() {
  try {
    const ip = process.argv[2];
    if (typeof ip !== 'string') {
      console.error("IP expected as argument");
      process.exit(1);
      return;
    }
    const userhashes = await getAllUserhashesFromIP(ip);
    const activityByHour = await getActivityByHour(userhashes);
    for (let hour of Object.keys(activityByHour)) {
      console.log(`${hour},${activityByHour[hour]}`);
    }
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

function forEachAction(cb: (action: Object) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream('/var/log/tinyboard/action.log')
    });
    rl.on('line', line => {
      try {
        const action = JSON.parse(line);
        cb(action);
      } catch(e) {
        reject(e);
      }
    });
    rl.on('close', () => {
      resolve();
    });
    rl.on('error', reject);
  });
}

async function getAllUserhashesFromIP(ip: string): Promise<Set<string>> {
  const userhashesPass1 = new Set();
  await forEachAction(action => {
    if (action.userhash && action.ip && action.ip.startsWith(ip)) {
      userhashesPass1.add(action.userhash);
    }
  });
  const ips = new Set();
  await forEachAction(action => {
    if (action.userhash && action.ip && userhashesPass1.has(action.userhash)) {
      ips.add(action.ip);
    }
  });
  const userhashesPass2 = new Set();
  await forEachAction(action => {
    if (action.userhash && action.ip && ips.has(action.ip)) {
      userhashesPass2.add(action.userhash);
    }
  });
  return userhashesPass2;
}

async function getActivityByHour(userhashes: Set<string>): Promise<{[hour:number]: number}> {
  const activityByHour = Object.create(null);
  for (let i=0; i<24; i++) {
    activityByHour[i] = 0;
  }
  await forEachAction(action => {
    if (userhashes.has(action.userhash)) {
      const d = new Date(action.time);
      const hour = d.getUTCHours();
      activityByHour[hour]++;
    }
  });
  return activityByHour;
}
