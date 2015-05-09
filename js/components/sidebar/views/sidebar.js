module.exports = Backbone.View.extend({
    template: function () {
        return '<h1>Sidebar</h1><div class="toolbox"><h2>Toolbox1</h2></div><div class="toolbox"><h2>Toolbox2</h2></div><div class="buttons"><ul><li><button>btn1</button></li><li><button>btn2</button></li><li><button>btn3</button></li></ul></div>';
    },

    initialize: function () {

    },

    render: function () {
        this.$el.html(this.template());
        return this;
    }
});
