var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML: '<h3>Link</h3>'
    + '<li><label for="count">count: </label><input id="count" type="text" name="count" value="{{count}}"></li>',

    events: {
        "keyup input#count": 'onCountChange'
    },

    onCountChange: function (e) {
        var value = e.target.value;
        this.model.setCount(value);
    },

    prepareModel: function () {
        var tokenTransitionCount = this.model.getCount();
        return {
            count: tokenTransitionCount
        };
    }
});