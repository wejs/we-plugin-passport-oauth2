var assert = require('assert');
var request = require('supertest');
var helpers = require('we-test-tools').helpers;
var stubs = require('we-test-tools').stubs;
var http;
var we;
var agent;

describe('we-plugin-passport-tokenFeature', function() {
  var salvedUser, salvedUserPassword, authenticatedRequest;

  before(function (done) {
    http = helpers.getHttp();
    agent = request.agent(http);

    we = helpers.getWe();

    var userStub = stubs.userStub();
    helpers.createUser(userStub, function(err, user) {
      if (err) throw err;

      salvedUser = user;
      salvedUserPassword = userStub.password;
      done();
    })
  });

  describe('API', function () {
    it ('post /auth/login-for-token it authenticate with valid user creds', function(done){

      request(http)
      .post('/auth/login-for-token')
      .send({
        email: salvedUser.email,
        password: salvedUserPassword
      })
      .expect(201)
      .end(function (err, res) {
        if (err) throw err;

        assert(res.body.user);
        assert.equal(res.body.user.id, salvedUser.id);
        assert(res.body.token);
        assert(res.body.token.token);
        assert.equal(res.body.token.tokenType, 'passportToken');

        request(http)
        .get('/account')
        .set('Authorization', 'Bearer ' + res.body.token.token)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
          if (err) throw err;

          assert(res.body.user[0]);
          assert.equal(res.body.user[0].id, salvedUser.id);

          done();
        });
      });

    });

    it ('post /auth/login-for-token should return error with wrong password', function(done){

      request(http)
      .post('/auth/login-for-token')
      .send({
        email: salvedUser.email,
        password: 'somethingworkng'
      })
      .expect(400)
      .end(function (err, res) {
        if (err) throw err;
        assert(!res.body.user);
        assert(!res.body.token);
        assert.equal(res.body.message, 'auth.login.user.incorrect.password.or.email');
        done();
      });
    });
  });
});