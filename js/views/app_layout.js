var SidebarView = require('../components/sidebar/views/sidebar');
var GraphView = require('../components/content/views/graph');
var joint = require('jointjs');
var graph = joint.dia.Graph;

module.exports = Backbone.View.extend({
        el: 'body',
        sidebar: '#sidebar',
        content: '#content',

        template: function () {
            return '<div id="app"><div id="header"><h1>Petri Nets Simulator</h1></div><div id="sidebar"></div><div id="content"></div><div id="footer"></div></div>';
        },

        initialize: function () {
            this.views = {};
        },

        render: function () {
            this.$el.html(this.template());
            this.views = {
                sidebar: new SidebarView({el: '#sidebar'}),
                content: new GraphView({el: '#content'})
            };

            _.each(this.views, function (view) {
                view.render();
            });

            return this;
        }
    }
);