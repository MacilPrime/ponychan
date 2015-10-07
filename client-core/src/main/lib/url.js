import config from '../config';

export function make_thread_url(board, postnum) {
	if (document.location.pathname == config.site.siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'.html';
	else
		return config.site.siteroot+board+'/res/'+postnum+'.html';
}

export function make_thread50_url(board, postnum) {
	if (document.location.pathname == config.site.siteroot+'mod.php')
		return '?/'+board+'/res/'+postnum+'+50.html';
	else
		return config.site.siteroot+board+'/res/'+postnum+'+50.html';
}
