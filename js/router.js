var HomeView = require('./views/app_layout');

module.exports = Backbone.Router.extend({

    routes: {
        "": "home"
    },

    home: function () {
        var homeView = new HomeView().render();
    }
});
