(function() {
  if (window.localStorage && localStorage.getItem("saw_proposal")) {
    return;
  }
  setTimeout(function() {
    if ($('#news-alert').length == 0) {
      var $prev = $('<span/>').text('[!]').css('color','green').attr('id', 'news-alert');
      $('.watcherButton').prepend($prev, ' ');
    }

    if ($('#news-item').length == 0) {
      var a = '<div class="wthread" id="news-item"><div class="wtop"><a href="/site/res/15219.html" style="color:white;text-decoration:underline"><span style="color:green">News:</span> Potential Ponychan-MLPchan Merger</a></div></div>';
      $('#watcherScreen').prepend(a);
    }
  }, 0);
})();
