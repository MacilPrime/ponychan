/* @flow */

import config from '../config';
import fs from 'fs';

const fileUrls: Map<string,string> = new Map();

export default function cachebust(filename: string): string {
  const cachedUrl = fileUrls.get(filename);
  if (cachedUrl) {
    return cachedUrl;
  }
  let url = filename;
  try {
    const filepath = `${__dirname}/../../${config.core.path}${filename}`;
    const stat = fs.statSync(filepath);
    url += `?v=${Math.floor(stat.mtime.getTime() / 1000)}`;
  } catch(err) {
    if (process.env.NODE_ENV === 'production' || filename !== '/instance.js') {
      console.error("Caught error in cachebust", err, err.stack);
    }
  }
  if (process.env.NODE_ENV === 'production') {
    fileUrls.set(filename, url);
  }
  return url;
}
