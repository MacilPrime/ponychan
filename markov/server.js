import fs from 'fs';
import Markov from './markov-mmap';
import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';

console.log("Loading...");
const m = new Markov(__dirname+'/dat/posts-trained-all.dat');
console.log("Done.");

const app = express();
if (process.env.NODE_ENV !== 'production') {
  app.set('json spaces', 2);
}
app.set('trust proxy', true);

app.use(morgan('combined'));

app.post('/markov/autocomplete', bodyParser.json(), async (req, res, next) => {
  try {
    const {sentence} = req.body;
    if (typeof sentence !== 'string') {
      throw new Error("Missing sentence parameter");
    }
    const parts = sentence.match(/[\w'`~:;\|\+\/\\\-_=@#$%^&\*]+/g);
    const rest = m.predictSentence(parts || []);
    const response = `${sentence} ${rest}`;
    res.send({response, rest});
    console.log(JSON.stringify({ip: req.ip, start: sentence, rest}));
  } catch(err) {
    next(err);
  }
});

const host = process.env.HOST || '';
const port = process.env.PORT || 4100;

app.listen(port, host, function() {
  console.log(`Now listening on ${host}:${port}`);
});
