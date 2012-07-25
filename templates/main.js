{% raw %}

var selectedstyle = '{% endraw %}{{ config.default_stylesheet.0|addslashes }}{% raw %}';
var styles = {
	{% endraw %}
	{% for stylesheet in stylesheets %}{% raw %}'{% endraw %}{{ stylesheet.name|addslashes }}{% raw %}' : '{% endraw %}{{ stylesheet.uri|addslashes }}{% raw %}',
	{% endraw %}{% endfor %}{% raw %}
};

var cookiename = '{% endraw %}{{ config.cookies.js }}{% raw %}';

var genpassword_chars = '{% endraw %}{{ config.genpassword_chars }}{% raw %}';

{% endraw %}{% if config.google_analytics %}{% raw %}

var _gaq = _gaq || [];_gaq.push(['_setAccount', '{% endraw %}{{ config.google_analytics }}{% raw %}']);{% endraw %}{% if config.google_analytics_domain %}{% raw %}_gaq.push(['_setDomainName', '{% endraw %}{{ config.google_analytics_domain }}{% raw %}']){% endraw %}{% endif %}{% if not config.google_analytics_domain %}{% raw %}_gaq.push(['_setDomainName', 'none']){% endraw %}{% endif %}{% raw %};_gaq.push(['_trackPageview']);(function() {var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);})();{% endraw %}{% endif %}

