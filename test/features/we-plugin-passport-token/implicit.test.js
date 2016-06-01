var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var query = require('querystring');
var app;
var we, agent, clients= [], salvedUser, salvedUserPassword;

describe('Implicit Grant Type ',function() {

  before(function (done) {
    app = helpers.getHttp();
    agent = request.agent(app);

    we = helpers.getWe();

    we.utils.async.series([
      function createUser(done) {
        var userStub = stubs.userStub();
        helpers.createUser(userStub, function(err, user) {
          if (err) throw err;

          salvedUser = user;
          salvedUserPassword = userStub.password;
          done();
        });
      },

      function createClients(done) {
        var cs = [{
          name:           'client1.name',
          secret:         'client1.secret',
          redirectUri:    'http://example.org/oauth2'
        },
        {
          name:           'client2.name',
          secret:         'client2.Secret',
          redirectUri:    'http://example.org/oauth2'
        },
        {
          name:           'client3.name',
          secret:         'client3.Secret',
          redirectUri:    'http://example.org/oauth3'
        }];

        we.utils.async.eachSeries(cs, function (c, next) {
          we.db.models.oauth2Client.create(c)
          .then(function (r) {
            clients.push(r);
            next();
          }).catch(next);
        }, done);
       }
    ], done);
  });

  var loginUrl, authorizationUrl, cookie, accessToken;
  var cookiePattern = new RegExp('wejs.sid=(.*?);');

  it('GET /oauth2/authorization with response_type="token" expect login form redirect', function(done) {
    request(app)
      .get('/oauth2/authorization?' + query.stringify({
      redirect_uri: clients[1].redirectUri,
      client_id: clients[1].id,
      response_type: 'token'
    }))
    .expect('Location', new RegExp('login'))
    .expect(302, function(err, res) {
      if (err) {
        console.error(res.headers);
        return done(err);
      }

      loginUrl = res.headers.location;
      done();
    });
  });

  it('POST /oauth2/login authorize', function(done) {
    request(app)
    .post(loginUrl)
    .send({ email: salvedUser.email, password: salvedUserPassword })
    .expect('Location', new RegExp('authorization'))
    .set('Accept', 'application/json')
    .expect(302, function (err, res) {
      if (err) {
        console.log('res.text>', res.text)
        console.error('res.headers>', res.headers);
        return done(err);
      }
      authorizationUrl = res.headers.location;
      cookie = cookiePattern.exec(res.headers['set-cookie'][0])[0];
      done();
    });
  });

  it('GET /oauth2/authorization with response_type="token" expect decision', function(done) {
    request(app)
    .get(authorizationUrl)
    .set('Cookie', cookie)
    .expect(200, function(err, res) {
      if (err) {
        console.log(authorizationUrl);
        console.log(res.text);
        console.log(res.headers);
        return done(err);
      }
      done();
    });
  });

  it('POST /oauth2/authorization with response_type="token" and decision="1" expect code redirect', function(done) {
    request(app)
    .post(authorizationUrl)
    .send({ decision: 1 })
    .set('Cookie', cookie)
    .expect(302, function(err, res) {
      if (err) return done(err);

      var uri = res.headers.location;
      if (uri.indexOf('#') == -1) return done(new Error('Failed to parse redirect uri'));
      var q = query.parse(uri.substr(uri.indexOf('#') + 1));
      if (!q.access_token) return done(new Error('No code value found in redirect uri'));

      accessToken = q.access_token;
      done();
    });
  });

  it('POST /oauth2/secure expect authorized', function(done) {
    request(app)
    .get('/oauth2/secure')
    .set('Authorization', 'Bearer ' + accessToken)
    .expect(200, new RegExp(salvedUser.id, 'i'), done);
  });
});
