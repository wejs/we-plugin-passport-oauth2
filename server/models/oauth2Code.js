/**
 * oauth2code
 *
 * @module      :: Model
 * @description :: oauth2code model
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      code: { type: we.db.Sequelize.STRING(100) },
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