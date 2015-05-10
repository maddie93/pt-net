var Toolbox = require('./toolbox');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    additionalPanel: '#additional',
    template: function () {
        return '<h1>Nodes Toolbox</h1><div id="nodes" class="toolbox"></div><h1>Node Options</h1><div id="additional" class="toolbox"></div><div class="buttons"><ul><li><button>btn1</button></li><li><button>btn2</button></li><li><button>btn3</button></li></ul></div>';
    },

    initialize: function () {
        this.views = {};
    },

    render: function () {
        this.$el.html(this.template());
        this.views = {
            nodesPanel: new Toolbox({el: '#nodes'})
            //additionalPanel: new Toolbox({el: '#additional'})
        };

        _.each(this.views, function (view) {
            view.render();
        });

        return this;
    }
});
