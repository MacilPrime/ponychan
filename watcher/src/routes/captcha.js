/* @flow */

import ip from 'ip';
import Recaptcha2 from 'recaptcha2';
import config from '../config';
import {mysql, mysql_query} from '../database';

const recaptcha = new Recaptcha2({
  siteKey: config.recaptcha.site_key,
  secretKey: config.recaptcha.secret_key
});

async function userNeedsToDoCaptcha(userIp: string): Promise<boolean> {
  const ipType = ip.isV4Format(userIp) ? 0 : 1;
  const [results] = await mysql_query(
    `SELECT id
    FROM needs_captcha
    WHERE
    range_type = ? AND range_start <= INET6_ATON(?) AND INET6_ATON(?) <= range_end
    LIMIT 1`, [ipType, userIp, userIp]);
  return results.length !== 0;
}

async function markCaptchaComplete(userIp: string) {
  const ipType = ip.isV4Format(userIp) ? 0 : 1;
  const conn = await new Promise((resolve, reject) => {
    mysql.getConnection((err, conn) => {
      if (err) reject(err); else resolve(conn);
    });
  });

  try {
    await new Promise((resolve, reject) => {
      conn.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      conn.query(
        `INSERT INTO solved_captcha (ip_type, ip_data)
        VALUES (?, INET6_ATON(?))`,
        [ipType, userIp],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    await new Promise((resolve, reject) => {
      conn.query(
        `DELETE FROM needs_captcha
        WHERE
        range_type = ? AND range_start <= INET6_ATON(?) AND INET6_ATON(?) <= range_end`,
        [ipType, userIp, userIp],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    await new Promise((resolve, reject) => {
      conn.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    conn.release();
  } catch (err) {
    conn.destroy();
    throw err;
  }
}

export async function get(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader('Cache-Control', 'private');

    const needsCaptcha = await userNeedsToDoCaptcha(req.ip);
    if (!needsCaptcha) {
      res.render('captcha/no-need');
      return;
    }

    res.render('captcha/challenge', {recaptcha: config.recaptcha});
  } catch (err) {
    next(err);
  }
}

export async function post(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader('Cache-Control', 'private');

    const recaptchaResponse = req.body['g-recaptcha-response'];
    if (typeof recaptchaResponse !== 'string') {
      throw new Error('g-recaptcha-response parameter missing');
    }

    await recaptcha.validate(recaptchaResponse, req.ip);
    await markCaptchaComplete(req.ip);
    res.render('captcha/complete');
  } catch (err) {
    next(err);
  }
}
