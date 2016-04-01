import fs from 'fs';
import Markov from './markov-mmap';

if (process.argv.length !== 3) {
  throw new Error("argument required");
}

const m = new Markov(process.argv[2]);

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', line => {
  console.log(m.predictSentence(line.split(/\s+/).filter(Boolean)));
});

console.log('ready');
