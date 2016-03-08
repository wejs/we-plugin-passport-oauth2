/**
 * Add Accept in all requests by default
 */
$.ajaxPrefilter(function( options ) {
  if ( !options.beforeSend) {
    options.beforeSend = function (xhr) {
      xhr.setRequestHeader('Accept', 'application/json');

      // set auth token
      if ($.cookie('weoauth')) xhr.setRequestHeader('Authorization','Bearer ' + $.cookie('weoauth'));
    };
  }
});

(function (we) {

  we.oauth2 = {};

})(window.we);