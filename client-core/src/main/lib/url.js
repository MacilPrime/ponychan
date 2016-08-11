/* @flow */

import config from '../config';

export function make_thread_url(board: string, postnum: number): string {
  if (config.isMod)
    return '/mod.php?/'+board+'/res/'+postnum+'.html';
  else
    return config.site.siteroot+board+'/res/'+postnum+'.html';
}

export function make_thread50_url(board: string, postnum: number): string {
  if (config.isMod)
    return '/mod.php?/'+board+'/res/'+postnum+'+50.html';
  else
    return config.site.siteroot+board+'/res/'+postnum+'+50.html';
}
