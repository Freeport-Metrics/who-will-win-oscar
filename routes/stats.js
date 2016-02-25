function hello(req, res) {
  res.render('stats');
}

module.exports = function (app) {
  app.get('/stats', hello);
};
