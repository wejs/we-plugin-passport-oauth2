var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var _ = require('lodash');
var http;
var we;

describe('oauth2ClientFeature', function () {
  var salvedUser, salvedUserPassword, clients = [];
  var authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;

      // login user and save the browser
      authenticatedRequest = request.agent(http);
      authenticatedRequest.post('/login')
      .set('Accept', 'application/json')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(200)
      .set('Accept', 'application/json')
      .end(function (err) {
        if (err) throw err;

        var cs = [{
          name:           'client1.name',
          secret:         'client1.secret',
          redirectUri:    'http://example.org/oauth2',
          creatorId  : salvedUser.id
        },
        {
          name:           'client2.name',
          secret:         'client2.Secret',
          redirectUri:    'http://example.org/oauth2',
          creatorId  : salvedUser.id
        },
        {
          name:           'client3.name',
          secret:         'client3.Secret',
          redirectUri:    'http://example.org/oauth3',
          creatorId  : salvedUser.id
        }];

        we.utils.async.eachSeries(cs, function (c, next) {
          we.db.models.oauth2Client.create(c)
          .then(function (r) {
            clients.push(r);
            next();
          }).catch(next);
        }, done);
      });

    });
  });

  describe('find', function () {
    it('get /oauth2Client route should find one oauth2Client', function (done) {

      authenticatedRequest
      .get('/oauth2Client')
      .set('Accept', 'application/json')
      .expect(200)
      .end(function (err, res) {
        if (err) {
          console.log(res.text);
          return done(err);
        }

        assert(res.body.oauth2Client);
        assert( _.isArray(res.body.oauth2Client) , 'oauth2Client not is array');
        assert(res.body.meta);

        done();
      });
    });
  });
  describe('create', function () {
    it('post /oauth2Client create one oauth2Client record');
  });
  describe('findOne', function () {
    it('get /oauth2Client/:id should return one oauth2Client');
  });
  describe('update', function () {
    it('put /oauth2Client/:id should upate and return oauth2Client');
  });
  describe('destroy', function () {
    it('delete /oauth2Client/:id should delete one oauth2Client')
  });
});
