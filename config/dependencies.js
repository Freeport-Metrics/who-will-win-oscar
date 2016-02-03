/**
 * Created by Matuszewski on 03/02/16.
 */
module.exports = function(app, express, path, dir){
  app.use('/js',  express.static(dir + '/node_modules/angular/'));
  app.use('/js', express.static(dir + '/node_modules/socket.io-client/'));
  app.use(express.static(path.join(dir, 'public')));
}