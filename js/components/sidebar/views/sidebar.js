var Toolbox = require('./toolbox');

module.exports = Backbone.View.extend({
    nodesPanel: '#nodes',
    additionalPanel: '#additional',
    template: function () {
        return '<h1>Sidebar</h1><div id="nodes" class="toolbox"><h2>Toolbox1</h2></div><div id="additional" class="toolbox"><h2>Toolbox2</h2></div><div class="buttons"><ul><li><button>btn1</button></li><li><button>btn2</button></li><li><button>btn3</button></li></ul></div>';
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
