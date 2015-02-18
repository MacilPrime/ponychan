import $ from 'jquery';

export default function setCss(key, css) {
	var $style = $("style.setcss#setcss_"+key);
	if (!$style.length && css) {
		$style = $("<style/>")
			.addClass("setcss")
			.attr("id", "setcss_"+key)
			.attr("type", "text/css")
			.appendTo(document.head);
	}
	$style.text(css);
}
