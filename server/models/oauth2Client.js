/**
 * oauth2Client
 *
 * @module      :: Model
 * @description :: oauth2Client model
 */

module.exports = function (we) {
  var model = {
    definition: {
      name: { type: we.db.Sequelize.STRING(256) },
      secret: { type: we.db.Sequelize.STRING(256) },
      redirectUri: { type: we.db.Sequelize.TEXT }
    },
    associations: {
      creator: { type: 'belongsTo', model: 'user' }
    }
  };

  return model;
};