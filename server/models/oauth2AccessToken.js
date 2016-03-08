/**
 * oauth2AccessToken
 *
 * @module      :: Model
 * @description :: oauth2accesstoken model
 *
 */

module.exports = function (we) {
  var model = {
    definition: {
      token: { type: we.db.Sequelize.STRING },
      scope: {
        type: we.db.Sequelize.TEXT,
        skipSanitizer: true,
        get: function()  {
          if (this.getDataValue('scope'))
            return JSON.parse( this.getDataValue('scope') );
          return {};
        },
        set: function(object) {
          if (typeof object == 'object') {
            this.setDataValue('scope', JSON.stringify(object));
          } else {
            throw new Error('invalid error in oauth2AccessToken scope value: ', object);
          }
        }
      },
      ttl: { type: we.db.Sequelize.STRING(100) }
    },
    associations: {
      client: { type: 'belongsTo', model: 'oauth2Client' },
      user: { type: 'belongsTo', model: 'user' }
    }
  };

  return model;
};