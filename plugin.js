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

  var oauth2 = new Oauth2lib({log: { level: 2 }});
  // save oauth 2 ref in plugin
  plugin.oauth2 = oauth2;
  // set plugin configs
  plugin.setConfigs({
    oauth2: {
      redirectToLoginUrl: '/login'
    },
    // passport: {
    //   strategies: {
    //     bearer: {
    //       Strategy: require('we-passport-http-bearer'),
    //       session: false,

    //       usernameField: 'email',
    //       passwordField: 'password',

    //       findUser: function findUserAndValidPassword(token, done) {
    //         this.we.auth.findUserWIthAccessToken(token, done);
    //       }
    //     }
    //   }
    // }
  });

  plugin.setResource({
    name: 'oauth2Client'
  });

  // set plugin routes
  plugin.setRoutes({
    // Return a list of messages between authenticated user and :uid user
    // 'post /auth/login-for-token': {
    //   controller    : 'passportOauth2',
    //   action        : 'loginForGetToken',
    //   responseType  : 'json'
    // },
    'post /oauth2/token': {
      controller    : 'passportOauth2',
      action        : 'token',
      permission    : true
    },
    'get /oauth2/authorization': {
      controller    : 'passportOauth2',
      action        : 'authorization',
      permission    : true
    },
    'post /oauth2/authorization': {
      controller    : 'passportOauth2',
      action        : 'authorization',
      permission    : true
    },
    // // list clients
    // 'get /oauth/client': {
    //   name          : 'oauth2Client.find',
    //   controller    : 'oauth2Client',
    //   action        : 'find',
    //   model         : 'oauth2Client',
    //   permission    : 'find_oauth2Client',
    //   template      :  'oauth2Client/find',
    //   titleHandler: 'i18n',
    //   titleI18n: 'oauth2Client.find',
    //   breadcrumbHandler: 'find'
    // },
    // // create
    // 'post /oauth/client': {
    //   action: 'create',
    //   controller: 'oauth2Client',
    //   model: 'oauth2Client',
    //   permission: 'create_oauth2Client',
    //   responseType  : 'json'
    // },
    // // update
    // 'put /oauth/client/:oauth2ClientId': {
    //   resourceName  : 'oauth2Client',
    //   controller    : 'oauth2Client',
    //   action        : 'edit',
    //   model         : 'oauth2Client',
    //   permission    : 'update_oauth2Client',
    //   responseType  : 'json'
    // },
    // // delete
    // 'delete /oauth/client/:oauth2ClientId': {
    //   resourceName  : 'oauth2Client',
    //   controller    : 'oauth2Client',
    //   action        : 'delete',
    //   model         : 'oauth2Client',
    //   permission    : 'delete_oauth2Client',
    //   responseType  : 'json'
    // },

    // 'get /oauth/client/:oauth2ClientId': {
    //   resourceName: 'oauth2Client',
    //   name: 'oauth2Client.findOne',
    //   action: 'findOne',
    //   controller: 'oauth2Client',
    //   model: 'oauth2Client',
    //   template: 'oauth2Client/findOne',
    //   permission: 'find_oauth2Client',
    //   titleHandler: 'i18n',
    //   titleI18n: 'oauth2Client.findOne',
    //   breadcrumbHandler: 'findOne'
    // }
  });

  // plugin.events.on('we:after:load:plugins', function(we) {
  //   we.auth.findUserWIthAccessToken = function findUserWIthAccessToken(token, done) {
  //     return we.db.models.accesstoken.findOne({
  //       where: {
  //         token: token, isValid: true
  //       }
  //     })
  //     .then(function (tokenObj) {
  //       if (!tokenObj) return done(null, false);

  //       var accessTokenTime = we.config.passport.accessTokenTime;

  //       var notIsExpired = we.auth.util.checkIfTokenIsExpired(tokenObj, accessTokenTime);
  //       if (!notIsExpired) return done(null, false);

  //       we.db.models.user.findOne({
  //         where: { id: tokenObj.userId }
  //       }).then(function (user) {
  //         if (!user) return done(null, false);
  //         // TODO add suport to scopes
  //         return done(null, user, { scope: 'all' });
  //       });
  //     });
  //   }
  // });

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
      return req.user;
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

    if (we.env == 'test') {
      // Some secure method
      we.express.get('/oauth2/secure', oauth2.middleware.bearer, function (req, res) {
        if (!req.oauth2.accessToken) return res.status(403).send('Forbidden');
        if (!req.oauth2.accessToken.userId) return res.status(403).send('Forbidden');
        res.send('Hi! Dear user ' + req.oauth2.accessToken.userId + '!');
      });
    }

    oauth2.isAuthorized = function isAuthorized(req, res, next) {
      if (req.isAuthenticated()) {
        next();
      } else {
        var params = req.query;
        params.backUrl = req.path;
        res.redirect(
          we.config.oauth2.redirectToLoginUrl+'?'+query.stringify(params)
        );
      }
    }

    we.express.post('/login', function beforeLogin(req, res, next) {
      if (!req.query.redirect_uri) return next();

      we.db.models.oauth2Client
      .findById(req.query.client_id)
      .then(function afterFind(c) {
        if (!c) return res.notFound();
        if (c.redirectUri != req.query.redirect_uri)
          return res.badRequest();
        // valid oauth2Client
        res.locals.oauth2Client = c;

        var backUrl = req.query.backUrl ? req.query.backUrl : '/';
        delete(req.query.backUrl);
        backUrl += backUrl.indexOf('?') > -1 ? '&' : '?';
        backUrl += query.stringify(req.query);

        res.locals.redirectTo = backUrl;

        next();
      })
      .catch(next);
    })
  });

  return plugin;
};