import fs from 'fs';
import mmap from 'mmap-io';

const SENTENCE_ENDING_PUNCTUATION = ['.', '!', '?'];

export default class Markov {
  constructor(filename) {
    const fd = fs.openSync(filename, 'r');
    const {size} = fs.fstatSync(fd);
    this._locationLookup = Object.create(null);
    this._mem = mmap.map(size, mmap.PROT_READ, mmap.MAP_PRIVATE, fd);
    this._version = this._mem[0];
    if (![1,2].includes(this._version)) {
      throw new Error(`Invalid version ${this._version}`);
    }
    this._divider = this._version === 1 ? ':' : '\0';
    if (this._mem[size-1] !== 4) {
      throw new Error("Invalid footer");
    }
    this._order = this._mem[1];
    let i = 2;
    let currentWord = null;
    while (true) {
      if (i >= size) {
        throw new Error("Unexpected EOF");
      }
      const header = this._mem[i];
      if (header === 2) {
        const wordLen = this._mem.readInt32LE(i+1);
        currentWord = this._mem.slice(i+5, i+5+wordLen);
        i += 1 + wordLen + 4;
        this._locationLookup[currentWord] = i;
      } else if (header === 3) {
        i += 5 + this._mem.readInt32LE(i+5) + 4;
      } else if (header === 4) {
        break;
      } else {
        throw new Error(`Invalid header at ${i}: ${header}`);
      }
    }
  }

  predictWord(prevWords, i=Math.random()) {
    const prevWordsKey = prevWords.join(this._divider);
    const keyPos = this._locationLookup[prevWordsKey];
    if (!keyPos) return null;
    let allCount = 0;
    let header;
    let pos = keyPos;
    while((header = this._mem[pos]) === 3) {
      allCount += this._mem.readInt32LE(pos+1);
      pos += 1 + 4 + this._mem.readInt32LE(pos+5) + 4;
    }
    if (header !== 2 && header !== 4) {
      throw new Error(`Unexpected header ${header}`);
    }
    i *= allCount;
    pos = keyPos;
    while ((header = this._mem[pos]) === 3) {
      const count = this._mem.readInt32LE(pos+1);
      if (i < count) {
        const wordLen = this._mem.readInt32LE(pos+5);
        if (wordLen === 0) return null;
        const word = this._mem.slice(pos+9, pos+9+wordLen).toString();
        return word;
      }
      i -= count;
      pos += 1 + 4 + this._mem.readInt32LE(pos+5) + 4;
    }
    throw new Error("This should not happen");
  }

  predictSentence(startWords=[], limit=500) {
    const words = [];
    let prevWords = new Array(this._order).fill(null).concat(startWords).slice(-this._order);
    for (let i=0; i<limit; i++) {
      const word = this.predictWord(prevWords, Math.random());
      if (!word) {
        if (
          words.length &&
          SENTENCE_ENDING_PUNCTUATION.indexOf(words[words.length-1]) === -1
        ) {
          words.push('.');
        }
        break;
      }
      if (words.length && SENTENCE_ENDING_PUNCTUATION.indexOf(word) === -1) {
        words.push(' ');
      }
      words.push(word);

      prevWords.push(word);
      prevWords = prevWords.slice(-this._order);
    }
    return words.join('');
  }
}
