module.exports = {
  //  /**
  //  * Login API without session for get one valid authToken
  //  *
  //  * This action receives the static and JSON request
  //  */
  // loginForGetToken: function loginForGetToken(req, res) {
  //   var we = req.we;
  //   // use email or username params for username field
  //   var email = ( req.body.email || req.body.username );

  //   var password = req.body.password;

  //   // build the find user query
  //   var query = { where: {} };
  //   query.where[we.config.passport.strategies.bearer.usernameField] = email;
  //   // find user in DB
  //   we.db.models.user.findOne(query).then(function (user) {
  //     if (!user) {
  //       return res.status(400).send({ message: 'auth.login.wrong.email.or.password' });
  //     }
  //     // get the user password
  //     user.getPassword().then(function (passwordObj) {
  //       if (!passwordObj)
  //         return res.status(400).send({ message: 'auth.login.user.dont.have.password' });

  //       passwordObj.validatePassword(password, function (err, isValid) {
  //         if (err) return res.serverError(err);
  //         if (!isValid) {
  //           return res.status(400).send({ message: 'auth.login.user.incorrect.password.or.email' });
  //         } else {
  //           // authenticated
  //           if (!user.active) {
  //             we.log.debug('AuthController:login:User not active', email);
  //             res.addMessage('warning', {
  //               text: 'auth.login.user.not.active',
  //               vars: { email: email }
  //             });
  //             return res.badRequest();
  //           }

  //           we.db.models.accesstoken.create({
  //             userId: user.id, tokenType: 'passportToken'
  //           }).then(function (token){
  //             res.status(201).send({
  //               user: user,
  //               token: token,
  //               access_token: token.token,
  //               account_id: user.id
  //             });
  //           }).catch(res.queryError);
  //         }
  //       });
  //     })
  //   });
  // },

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

        console.log('>>/oauth2/authorization<<<');
        // Render our decision page
        // Look into ./test/server for further information
        res.render('authorization', {layout: false});
      })
    });
  }
};