var PlaceView = require('./node_options/place');
var TransitionView = require('./node_options/transition');

module.exports = Backbone.View.extend({
    tagName: "ul",
    endingTemplate: '<li><button id="remove">Remove</button></li>',

    template: function() {
        return this.endingTemplate;
    },

    initialize: function () {
        this.listenTo(EventBus, "selected:place", this.newPlaceSelected);
        this.listenTo(EventBus, "selected:transition", this.newTransitionSelected);
    },

    newPlaceSelected: function (cell) {
        this.nodeView = new PlaceView({model: cell});
        this.render();
        console.log('newPlaceSelected');
    },

    newTransitionSelected: function (cell) {
        this.nodeView = new TransitionView({model: cell});
        this.render();
        console.log('newTransitionSelected');
    },

    render: function () {
        if (this.nodeView) {
            this.$el.html(this.nodeView.render().$el);
            //this.$el.append(this.nodeView.render().$el);
            this.$el.append(this.template());
        }
        return this;
    }
});