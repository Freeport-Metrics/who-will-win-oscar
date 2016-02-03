function hello(req, res) {
  res.render('index');
}

module.exports = function (app) {
  app.get('/', hello);
};
