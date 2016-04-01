import Markov from './markov';

const m = new Markov({order: 2});

const rl = require('readline').createInterface({
  input: process.stdin
});

let lineNo = 0;
rl.on('line', line => {
  lineNo++;
  try {
    if (line) {
      const wm = line.match(/^WT:(\d+):/);
      let weight = 1;
      if (wm) {
        weight = +wm[1];
        line = line.slice(wm[0].length);
        if (!line) return;
      }

      const action = JSON.parse(line);
      if (action.action === 'post' && action.body_nomarkup) {
        m.train(action.body_nomarkup, weight);
      }
    }
    if (lineNo % 1000 === 0) console.error('processed', lineNo, 'lines');
  } catch(err) {
    console.error('failed on line', lineNo);
    console.error(err);
    process.exit(1);
  }
});

rl.on('close', () => {
  m.saveTo(process.stdout).catch(err => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  });
});
