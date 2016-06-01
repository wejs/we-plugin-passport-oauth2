module.exports = {
  create: function create(req, res) {
    if (!res.locals.template) res.locals.template = res.locals.model + '/' + 'create';

    if (!req.isAuthenticated) return res.forbidden();

    if (!res.locals.data) res.locals.data = {};

    if (req.method === 'POST') {
      req.body.creatorId = req.user.id;

      req.we.utils._.merge(res.locals.data, req.body);

      return res.locals.Model.create(req.body)
      .then(function (record) {
        res.locals.data = record;
        res.created();
      }).catch(res.queryError);
    } else {
      res.ok();
    }
  },

  edit: function edit(req, res) {
    if (!res.locals.template) res.locals.template = res.local.model + '/' + 'edit';

    var record = res.locals.data;
    // never update creator and code
    delete req.body.creatorId;
    delete req.body.code;

    if (req.we.config.updateMethods.indexOf(req.method) >-1) {
      if (!record) return res.notFound();

      record.updateAttributes(req.body)
      .then(function() {
        res.locals.data = record;
        return res.updated();
      }).catch(res.queryError);
    } else {
      res.ok();
    }
  }
};