var fs = require('fs');

module.exports = function (dir) {

  // only resources that exist to be able to define alternative paths for dependencies for different node versions
  function filterExisting(resources) {
    var result = [];
    resources.forEach(function (resource) {
      if (fs.existsSync(dir + '/' + resource)) {
        result.push(resource);
      } else {
        console.log('Skipping static resource:', resource);
      }
    })
    return result;
  }

  var resources = {
    js: [
      "node_modules/jquery/dist/jquery.min.js",
      "node_modules/angular/angular.min.js",
      "node_modules/angular-sanitize/angular-sanitize.min.js",
      "node_modules/socket.io-client/socket.io.js",
      "node_modules/socket.io/node_modules/socket.io-client/socket.io.js",
      "node_modules/d3/d3.min.js",
      "node_modules/c3/node_modules/d3/d3.min.js",
      "node_modules/c3/c3.min.js",
      "public/javascripts/app.js",
      "public/javascripts/app/components/components_wrapper.js",
      "public/javascripts/app/components/chart_directive.js",
      "public/javascripts/app/components/big_numbers_filter.js",
      "public/javascripts/app/controllers/controllers_wrapper.js",
      "public/javascripts/app/controllers/index_controller.js"
    ],
    css: [
      "node_modules/bootstrap/dist/css/bootstrap.css",
      "public/stylesheets/bootstrap.css",
      "public/stylesheets/style.css",
      "public/stylesheets/Glyphter.css",
      "node_modules/font-awesome/css/font-awesome.css",
      "node_modules/c3/c3.css"
    ]
  };

  return{
    js: filterExisting(resources.js),
    css: filterExisting(resources.css)
  }

};