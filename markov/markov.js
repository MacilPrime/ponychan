import fs from 'fs';
import find from 'lodash/find';
import {incremental} from 'bennu';
import parser from './parser';
import Kefir from 'kefir';

function write(stream, data) {
  return new Promise((resolve, reject) => {
    const r = stream.write(data, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const SENTENCE_ENDING_PUNCTUATION = ['.', '!', '?'];

export default class Markov {
  constructor(options) {
    this._order = options && options.order || 1;
    this._version = options && options.version || 2;
    this._divider = this._version === 1 ? ':' : '\0';
    // values are {
    //   allCount: number,
    //   words: Array<{count: number, word: string}>
    // }
    this._wordsToNext = new Map();
  }

  static async loadByRead(stream) {
    const onEnd = Kefir.fromEvents(stream, 'end');
    const onError = Kefir.fromEvents(stream, 'error')
      .merge(onEnd)
      .flatMap(value => Kefir.constantError(value));

    function read(size) {
      let r = stream.read(size);
      if (r != null) {
        return Promise.resolve(r);
      } else {
        return Kefir.fromEvents(stream, 'readable')
          .merge(onError)
          .takeErrors(1)
          .map(() => stream.read(size))
          .filter(r => r != null)
          .take(1)
          .toPromise();
      }
    }

    async function readUint8() {
      let b = await read(1);
      return b[0];
    }

    async function readInt32() {
      let b = await read(4);
      return b.readInt32LE(0);
    }

    async function readString() {
      let len = await readInt32();
      if (len === 0) return '';
      let b = await read(len);
      return b.toString();
    }

    if (await readUint8(1) !== 1) {
      throw new Error("invalid header");
    }
    const order = await readUint8(1);
    const m = new Markov({order});

    let entry = null;
    while(true) {
      const header = await readUint8(1);
      if (header === 2) {
        const word = await readString();
        entry = {allCount: 0, words: []};
        m._wordsToNext.set(word, entry);
      } else if (header === 3) {
        if (!entry) {
          throw new Error("expected entry start")
        }
        const count = await readInt32();
        const word = await readString() || null;
        entry.allCount += count;
        entry.words.push({count, word});
      } else if (header === 4) {
        break;
      } else {
        throw new Error(`invalid header byte ${header}`);
      }
    }
    return m;
  }

  static loadByBennu(stream) {
    return new Promise((resolve, reject) => {
      let p = incremental.runInc(parser);
      stream.on('data', chunk => {
        p = incremental.provideString(chunk, p);
      });
      stream.on('error', reject);
      stream.on('end', () => {
        try {
          const {order, entries} = incremental.finish(p);
          const m = new Markov({order});
          m._wordsToNext = new Map(entries);
          resolve(m);
        } catch(err) {
          reject(err);
        }
      });
    });
  }

  async saveTo(stream) {
    const START = Date.now();
    await write(stream, new Buffer([2, this._order]));

    const prevWordIntBuf = new Buffer(5);
    const wordIntBuf = new Buffer(9);

    for (let [prevWordsKey, entry] of this._wordsToNext) {
      const wordBuf = new Buffer(prevWordsKey);
      prevWordIntBuf[0] = 2;
      prevWordIntBuf.writeInt32LE(wordBuf.length, 1);
      stream.write(prevWordIntBuf);
      stream.write(wordBuf);
      for (let {count, word} of entry.words) {
        const wordBuf = new Buffer(word || "");
        wordIntBuf[0] = 3;
        wordIntBuf.writeInt32LE(count, 1);
        wordIntBuf.writeInt32LE(wordBuf.length, 5);
        stream.write(wordIntBuf);
        stream.write(wordBuf);
      }
    }

    await write(stream, new Buffer([4]));
    const END = Date.now();
    console.error('time elapsed saving', END-START, 'ms');
  }

  train(text, weight=1) {
    const words = [];
    (text.match(
      this._version===1 ? /[\w']+|\./g :
      /[\w'`~:;\|\+\/\\\-_=@#$%^&\*]+|[\.!?\n]/g
    ) || []).forEach(word => {
      if (word.length < 40 && !/^\d{5}/.test(word)) {
        if (word === '\n' || word === '\r') {
          words.push(null);
        } else if (SENTENCE_ENDING_PUNCTUATION.indexOf(word) !== -1) {
          words.push(word);
          words.push(null);
        } else {
          words.push(word);
        }
      }
    });
    words.push(null);

    let prevWords = new Array(this._order).fill(null);
    words.forEach(word => {
      if (word === null && prevWords[prevWords.length-1] === null) {
        return;
      }

      const prevWordsKey = prevWords.join(this._divider);
      let entry = this._wordsToNext.get(prevWordsKey);
      if (!entry) {
        entry = {
          allCount: weight,
          words: []
        };
        this._wordsToNext.set(prevWordsKey, entry);
      } else {
        entry.allCount += weight;
      }

      let wordEntry = find(
        entry.words, wordEntry => wordEntry.word === word
      );
      if (!wordEntry) {
        wordEntry = {count: weight, word};
        entry.words.push(wordEntry);
      } else {
        wordEntry.count += weight;
      }

      prevWords.push(word);
      prevWords = prevWords.slice(-this._order);
    });
  }

  predictWord(prevWords, i=Math.random()) {
    const prevWordsKey = prevWords.join(this._divider);
    const entry = this._wordsToNext.get(prevWordsKey);
    if (!entry) return null;
    i *= entry.allCount;
    for (let wordEntry of entry.words) {
      if (i < wordEntry.count) {
        return wordEntry.word;
      }
      i -= wordEntry.count;
    }
  }

  predictSentence(limit=500) {
    const words = [];
    let prevWords = new Array(this._order).fill(null);
    for (let i=0; i<limit; i++) {
      const word = this.predictWord(prevWords, Math.random());
      if (!word) break;
      words.push(word);

      prevWords.push(word);
      prevWords = prevWords.slice(-this._order);
    }
    return words.join(' ') + '.';
  }
}
