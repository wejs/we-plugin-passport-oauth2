/**
 * Plugin.js file for We.js oauth2 token authentication, use for your single page app
 *
 * see http://wejs.org/docs/we/plugin
 */

module.exports = function loadPlugin(projectPath, Plugin) {
  var plugin = new Plugin(__dirname);
  // set plugin configs
  plugin.setConfigs({
    passport: {
      strategies: {
        bearer: {
          Strategy: require('we-passport-http-bearer'),
          session: false,

          usernameField: 'email',
          passwordField: 'password',

          findUser: function findUserAndValidPassword(token, done) {
            this.we.auth.findUserWIthAccessToken(token, done);
          }
        }
      }
    }
  });

  // set plugin routes
  plugin.setRoutes({
    // Return a list of messages between authenticated user and :uid user
    'post /auth/login-for-token': {
      controller    : 'passportOauth2',
      action        : 'loginForGetToken',
      responseType  : 'json'
    }
  });

  plugin.events.on('we:after:load:plugins', function(we) {
    we.auth.findUserWIthAccessToken = function findUserWIthAccessToken(token, done) {
      return we.db.models.accesstoken.find({ where: {
        token: token, isValid: true
      }}).then(function (tokenObj) {
        if (!tokenObj) return done(null, false);

        var accessTokenTime = we.config.passport.accessTokenTime;

        var notIsExpired = we.auth.util.checkIfTokenIsExpired(tokenObj, accessTokenTime);
        if (!notIsExpired) return done(null, false);

        we.db.models.user.find({
          where: {id: tokenObj.userId},
          include: [ { model: we.db.models.role, as: 'roles'} ]
        }).then(function (user) {
          if (!user) return done(null, false);
          // TODO add suport to scopes
          return done(null, user, { scope: 'all' });
        });
      });
    }
  });
  plugin.events.on('we:after:load:passport', function(we) {
    we.express.use(function(req, res, next) {
      // skip if already authenticated
      if (req.isAuthenticated()) return next();
      we.passport.authenticate('bearer', { session: false }, function (err, user) {
        if (err) return next(err);
        req.user = user;
        next();
      })(req, res, next);
    })
  });
  return plugin;
};