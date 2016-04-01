import {lang, parse} from 'bennu';

function value(value) {
  return parse.token(
    t => t === value,
    (pos, found) => new parse.ExpectError(pos, value, found)
  );
}

const uint8 = parse.anyToken;
const int32 = parse.eager(lang.times(4, parse.anyToken))
  .map(bytes => {
    const b = new Buffer(bytes);
    return b.readInt32LE(0);
  });
const string = parse.eager(
    parse.bind(int32, len => lang.times(len, parse.anyToken))
  )
  .map(bytes => {
    const b = new Buffer(bytes);
    return b.toString();
  });

const serializedMarkov = parse.eager(parse.enumeration(
  value(1),
  uint8,
  parse.eager(parse.many(
    parse.eager(parse.enumeration(
      value(2),
      string,
      parse.eager(parse.many(
        parse.eager(parse.enumeration(
          value(3),
          int32,
          string
        ))
      ))
    )).map(items => {
      let allCount = 0;
      const words = [];
      items[2].forEach(wordItems => {
        const wordEntry = {
          count: wordItems[1], word: wordItems[2]
        };
        allCount += wordEntry.count;
        words.push(wordEntry);
      });
      return [
        items[1],
        {allCount, words}
      ];
    })
  )),
  value(4),
  parse.eof
)).map(items => {
  const order = items[1], entries = items[2];
  return {order, entries};
});

export default serializedMarkov;
