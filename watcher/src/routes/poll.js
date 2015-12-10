/* @flow */
//jshint ignore:start

export default async function poll(req: Object, res: Object, next: Function): any {
  try {
    res.setHeader("Cache-Control", "private");

    res.render('poll/index');
  } catch(err) {
    next(err);
  }
}
