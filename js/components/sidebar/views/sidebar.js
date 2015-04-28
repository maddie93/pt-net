module.exports = Backbone.View.extend({
    template: function() { return '<h1>Sidebar</h1>'; },

    render: function() {
        this.$el.html(this.template());
        return this;
    }
});
