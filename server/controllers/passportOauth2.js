module.exports = {
  token: function token(req, res, next) {
    req.we.plugins['we-plugin-passport-oauth2']
      .oauth2.controller.token(req, res, next);
  },

  authorization: function authorization(req, res) {
    var oauth2 = req.we.plugins['we-plugin-passport-oauth2'].oauth2;

    oauth2.isAuthorized(req, res, function(err) {
      if (err) return res.serverError(err);

      oauth2.controller.authorization(req, res, function (err) {
        if (err) return res.serverError(err);
        console.trace('TODO');
        // Render our decision page
        // Look into ./test/server for further information
        // res.render('authorization', { layout: false });
      })
    });
  },

  decision: function decision(req, res, client, scope, user) {
    res.locals.oauthClient = client;
    res.locals.scopes = 'get user data';
    // res.locals.scopes = scope.join();
    res.locals.user =  user;

    res.locals.template = 'passportOauth2/decision';
    res.ok();
  }
};