/**
 * oauth2RefreshToken
 *
 * @module      :: Model
 * @description :: oauth2refreshtoken model
 */

module.exports = function (we) {
  var model = {
    definition: {
      token: { type: we.db.Sequelize.STRING },
      scope: { type: we.db.Sequelize.STRING },
      ttl: { type: we.db.Sequelize.STRING(100) }
    },
    associations: {
      client: { type: 'belongsTo', model: 'oauth2Client' },
      user: { type: 'belongsTo', model: 'user' }
    }
  };

  return model;
};