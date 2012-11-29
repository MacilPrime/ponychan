$(document).ready(function() {
	if($('div.banner').length == 0)
		return; // not index

	function permalinkClick(event) {
		var href = $(this).attr('href');
		var hash = /#(.*)$/.exec(href)[1];
		if ($('#replyC_'+hash).not('.preview-hidden').length) {
			window.location.hash = hash;
			event.preventDefault();
		}
	}

	function permalinkProcess() {
		$(this).click(permalinkClick);
	};

	$('.permalink').each(permalinkProcess);

	$(document).bind('new_post', function(e, post) {
		$('.permalink', post).each(permalinkProcess);
	});
});
