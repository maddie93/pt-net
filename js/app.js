require('./globals');
//var $ = require('jquery')(window);
//var Backbone = require('backbone');
//Backbone.$ = $;

var Router = require('./router');
var router = new Router();


Backbone.history.start();