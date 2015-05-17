window._ = require('underscore');
window.$ = require('jquery');
window.Backbone = require('backbone');
window.Backbone.$ = $;
window.EventBus = _.extend({}, Backbone.Events);
window.Handlebars = require('handlebars');