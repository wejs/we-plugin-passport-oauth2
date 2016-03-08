/**
 * Plugin.js file for We.js oauth2 token authentication, use for your single page app
 *
 * see http://wejs.org/docs/we/plugin
 */

var Oauth2lib = require('oauth20-provider');
var query = require('querystring');
var crypto = require('crypto');

module.exports = function loadPlugin(projectPath, Plugin) {

  var plugin = new Plugin(__dirname);

  var oauth2 = new Oauth2lib({log: {level: 2}});
  // save oauth 2 ref in plugin
  plugin.oauth2 = oauth2;
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

  plugin.events.on('we:after:load:express', function afterLoadExpress(we) {

    // Set client methods
    oauth2.model.client.getId = function getId(client) {
      return client.id;
    };
    oauth2.model.client.getRedirectUri = function getRedirectUri(client) {
      return client.redirectUri;
    };
    oauth2.model.client.checkRedirectUri = function checkRedirectUri(client, redirectUri) {
      return (redirectUri.indexOf(oauth2.model.client.getRedirectUri(client)) === 0 &&
        redirectUri.replace(oauth2.model.client.getRedirectUri(client), '').indexOf('#') === -1);
    };
    oauth2.model.client.fetchById = function fetchById(id, cb) {
      we.db.models.oauth2Client.findById(id)
      .then(function afterFincOauthClient(c) {
        cb(null, c);
      }).catch(cb);
    };
    oauth2.model.client.checkSecret = function checkSecret(client, secret, cb) {
      return cb(null, client.secret == secret);
    };

    // User
    oauth2.model.user.getId = function getId(user) {
      return user.id;
    };
    oauth2.model.user.fetchById = function fetchById(id, cb) {
      we.db.models.user.findById(id)
      .then(function afterFindUser(user) {
        cb(null, user);
      }).catch(cb);
    };
    oauth2.model.user.fetchByUsername = function fetchById(username, cb) {
      we.db.models.user.findOne({
        where: { email: username }
      })
      .then(function afterFindUser(user) {
        cb(null, user);
      }).catch(cb);
    };
    oauth2.model.user.fetchFromRequest = function fetchFromRequest(req) {
      return req.session.user;
    };
    oauth2.model.user.checkPassword = function checkPassword(user, password, cb) {
      user.verifyPassword(password, cb);
    };

    // Refresh token
    oauth2.model.refreshToken.getUserId = function getUserId(refreshToken) {
      return refreshToken.userId;
    };
    oauth2.model.refreshToken.getClientId = function getClientId(refreshToken) {
      return refreshToken.clientId;
    };
    oauth2.model.refreshToken.getScope = function getScope(refreshToken) {
      return refreshToken.scope;
    };
    oauth2.model.refreshToken.fetchByToken = function fetchByToken(token, cb) {
      we.db.models.oauth2RefreshToken.findOne({
        where: { token: token }
      }).then(function afterFindToken(record) {
        cb(null, record);
      }).catch(cb);
    };
    oauth2.model.refreshToken.removeByUserIdClientId = function removeByUserIdClientId(userId, clientId, cb) {
      we.db.models.oauth2RefreshToken.destroy({
        where: { userId: userId, clientId: clientId }
      }).then(function afterDestroyToken(record) {
        cb(null, record);
      }).catch(cb);
    };
    oauth2.model.refreshToken.removeByRefreshToken = function removeByRefreshToken(token, cb) {
      we.db.models.oauth2RefreshToken.destroy({
        where: { token: token}
      }).then(function afterDestroyToken(record) {
        cb(null, record);
      }).catch(cb);
    };
    oauth2.model.refreshToken.create = function createRefreshToken(userId, clientId, scope, cb) {
      var token = crypto.randomBytes(64).toString('hex');

      we.db.models.oauth2RefreshToken.create({
        token: token,
        userId: userId,
        clientId: clientId,
        scope: scope
      }).then(function afterCreateToken(r) {
        cb(null, r);
      }).catch(cb);
    };

    // Access token
    oauth2.model.accessToken.getToken = function getToken(accessToken) {
      return accessToken.token;
    };
    oauth2.model.accessToken.fetchByToken = function fetchByToken(token, cb) {
      we.db.models.oauth2AccessToken.findOne({
        where: { token: token }
      }).then(function afterFindAccessToken(r) {
        cb(null, r);
      }).catch(cb);
    };
    oauth2.model.accessToken.checkTTL = function checkTTL(accessToken) {
      return (accessToken.ttl > new Date().getTime());
    };
    oauth2.model.accessToken.getTTL = function getTTL(accessToken, cb) {
      var ttl = we.utils.moment(accessToken.ttl).diff(new Date(),'seconds');
      return cb(null, ttl>0?ttl:0);
    };
    oauth2.model.accessToken.fetchByUserIdClientId = function fetchByUserIdClientId(userId, clientId, cb) {
      we.db.models.oauth2AccessToken.findOne({
        where: {
          userId: userId, clientId: clientId
        }
      }).then(function afterFindAccessToken(r) {
        cb(null, r);
      }).catch(cb);
    };
    oauth2.model.accessToken.create = function createToken(userId, clientId, scope, ttl, cb) {
      var token = crypto.randomBytes(64).toString('hex');

      we.db.models.oauth2AccessToken.create({
        token: token,
        userId: userId,
        clientId: clientId,
        scope: scope,
        ttl: new Date().getTime() + ttl * 1000
      }).then(function afterCreateToken(r) {
        cb(null, r.token);
      }).catch(function (err){
        console.log(err);
        cb()
      });
    };

    // Code
    oauth2.model.code.create = function createCode(userId, clientId, scope, ttl, cb) {
      var code = crypto.randomBytes(32).toString('hex');
      // var ttl = new Date().getTime() + ttl * 1000;

      we.db.models.oauth2Code.create({
        code: code,
        userId: userId,
        clientId: clientId,
        scope: scope,
        ttl: new Date().getTime() + ttl * 1000
      }).then(function afterCreateCode(c) {
        cb(null, c);
      }).catch(cb);
    };
    oauth2.model.code.fetchByCode = function fetchByCode(code, cb) {
      we.db.models.oauth2Code.findOne({
        where: { code: code }
      }).then(function (c) {
        cb(null, c);
      }).catch(cb);
    };
    oauth2.model.code.removeByCode = function removeByCode(code, cb) {
      we.db.models.oauth2Code.destroy({
        where: { code: code }
      }).then(function () {
        cb();
      }).catch(cb);
    };
    oauth2.model.code.getUserId = function getUserId(code) {
      return code.userId;
    };
    oauth2.model.code.getClientId = function getClientId(code) {
      return code.clientId;
    };
    oauth2.model.code.getScope = function getScope(code) {
      return code.scope;
    };
    oauth2.model.code.checkTTL = function checkTTL(code) {
      return (code.ttl > new Date().getTime());
    };

    // Decision controller
    oauth2.decision = function decision(req, res, client, scope, user) {
      var html = [
        'Currently your are logged with id = ' + req.oauth2.model.user.getId(user),
        'Client with id ' + req.oauth2.model.client.getId(client) + ' asks for access',
        'Scope asked ' + scope.join(),
        '<form method="POST">',
        '<input type="hidden" name="decision" value="1" />',
        '<input type="submit" value="Authorize" />',
        '</form>',
        '<form method="POST">',
        '<input type="hidden" name="decision" value="0" />',
        '<input type="submit" value="Cancel" />',
        '</form>'
      ];
      res.send(html.join('<br />'));
    };

    we.express.use(oauth2.inject());

    we.express.post('/oauth2/token', oauth2.controller.token);
    we.express.get('/oauth2/authorization', isAuthorized, oauth2.controller.authorization, function (req, res) {
      console.log('>><<<')
      // Render our decision page
      // Look into ./test/server for further information
      res.render('authorization', {layout: false});
    });
    we.express.post('/oauth2/authorization', isAuthorized, oauth2.controller.authorization);

    // Define user login routes
    we.express.get('/oauth2/login', function(req, res) {
        res.render('login', {layout: false});
    });

    we.express.post('/oauth2/login', function(req, res, next) {
      var backUrl = req.query.backUrl ? req.query.backUrl : '/';
      delete(req.query.backUrl);
      backUrl += backUrl.indexOf('?') > -1 ? '&' : '?';
      backUrl += query.stringify(req.query);

      // Already logged in
      if (req.session.authorized) res.redirect(backUrl);
      // Trying to log in
      else if (req.body.username && req.body.password) {
        oauth2.model.user.fetchByUsername(req.body.username, function(err, user) {
          if (err) next(err);
          else {
            oauth2.model.user.checkPassword(user, req.body.password, function(err, valid) {
                if (err) next(err);
                else if (!valid) res.redirect(req.url);
                else {
                  req.session.user = user;
                  req.session.authorized = true;
                  res.redirect(backUrl);
                }
            });
          }
        });
      }
      // Please login
      else res.redirect(req.url);
    });

    if (we.env == 'test') {
      // Some secure method
      we.express.get('/oauth2/secure', oauth2.middleware.bearer, function (req, res) {
        if (!req.oauth2.accessToken) return res.status(403).send('Forbidden');
        if (!req.oauth2.accessToken.userId) return res.status(403).send('Forbidden');
        res.send('Hi! Dear user ' + req.oauth2.accessToken.userId + '!');
      });
    }


    function isAuthorized(req, res, next) {
      if (req.session.authorized) next();
      else {
        var params = req.query;
        params.backUrl = req.path;
        res.redirect('/oauth2/login?' + query.stringify(params));
      }
    }

  });

  plugin.events.on('we:after:load:passport', function afterLoadPassport(we) {
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

  plugin.addJs('we.oauth2.io', {
    type: 'plugin', weight: 11, pluginName: 'we-plugin-passport-oauth2',
    path: 'files/public/we.oauth2.js'
  });

  return plugin;
};