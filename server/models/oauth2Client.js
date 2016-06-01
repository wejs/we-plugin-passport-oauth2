/**
 * oauth2Client
 *
 * @module      :: Model
 * @description :: oauth2Client model
 */

module.exports = function (we) {
  var model = {
    definition: {
      id: {
        type: we.db.Sequelize.UUID,
        defaultValue: we.db.Sequelize.UUIDV4,
        primaryKey: true,
        formFieldType: null
      },
      name: {
        type: we.db.Sequelize.STRING(256),
        allowNull: false
      },
      secret: {
        type: we.db.Sequelize.STRING(256),
        formFieldType: null
      },
      redirectUri: {
        type: we.db.Sequelize.TEXT,
        formFieldType: 'text',
        allowNull: false,
        validate: { isUrl: true }
      }
    },
    associations: {
      creator: { type: 'belongsTo', model: 'user' }
    },
    options: {
      classMethods: {
        /**
         * Context loader, preload current request record and related data
         *
         * @param  {Object}   req  express.js request
         * @param  {Object}   res  express.js response
         * @param  {Function} done callback
         */
        contextLoader: function contextLoader(req, res, done) {
          if (!req.isAuthenticated()) return res.forbidden();

          if (res.locals.id) {
            return this.findOne({
              where: { id: res.locals.id},
              include: [{ all: true }]
            })
            .then(function afterFind(record) {
              res.locals.data = record;
              if (record && record.dataValues.creatorId && req.isAuthenticated()) {
                // set owner role
                if (
                  record.isOwner(req.user.id) &&
                  ( req.userRoleNames.indexOf('owner') == -1 )
                ) req.userRoleNames.push('owner');
              }

              return done();
            });
          } else if (res.locals.action == 'find') {
            // block access from others user clients in find request
            res.locals.query.where.creatorId = req.user.id;
            // add code and related models
            res.locals.query.include = [{ all: true }];
            done();
          } else {
            done();
          }
        }
      },
      hooks: {
        afterDestroy: function(opts, r, done) {
          we.db.models.oauth2Code.destroy({
            where: { clientId: r.id }
          })
          .then(function() {
            return we.db.models.oauth2RefreshToken.destroy({
              where: { clientId: r.id }
            });
          })
          .then(function(){
            return we.db.models.oauth2AccessToken.destroy({
              where: { clientId: r.id }
            });
          })
          .nodeify(done);
        }
      }
    }
  };

  return model;
};