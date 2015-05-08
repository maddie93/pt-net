var SidebarView = require('../components/sidebar/views/sidebar');
var GraphView = require('../components/content/views/graph');
var joint = require('jointjs');
var graph = joint.dia.Graph;

module.exports = Backbone.View.extend({
        el: 'body',
        sidebar: '#sidebar',
        content: '#content',
        template: function () {
            return '<div id="app"><div id="header"></div><div id="sidebar"></div><div id="content"></div><div id="footer"></div></div>';
        },

        initialize: function () {
            this.views = {};
            console.log("home initialize");
        },

        render: function () {
            this.$el.html(this.template());
            this.views = {
                sidebar: new SidebarView({el: '#sidebar'}),
                content: new GraphView({
                    el: '#content',
                    width: 1000,
                    height: 350,
                    gridSize: 10,
                    perpendicularLinks: true
                })
                /*
                 content: new joint.dia.Paper({
                 el: '#content',
                 width: 1000,
                 height: 350,
                 gridSize: 10,
                 perpendicularLinks: true,
                 model: this.graphModel
                 })
                 */
            };

            _.each(this.views, function (view) {
                view.render();
            });

            this.views.content.startSimulation();
            return this;
        }
    }
);