var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML: '<h3>Link</h3>'
    + '<li><label for="inputCount">source count: </label><input id="inputCount" type="text" name="inputCount" value="{{inputCount}}"></li>'
    + '<li><label for="outputCount">destination count: </label><input id="outputCount" type="text" name="outputCount" value="{{outputCount}}"></li>',

    events: {
        'keyup input#inputCount': 'onInputCountChange',
        'keyup input#outputCount': 'onOutputCountChange'
    },

    onInputCountChange: function (e) {
        var value = e.target.value;
        this.model.setSourceCount(value);
    },

    onOutputCountChange: function (e) {
        var value = e.target.value;
        this.model.setDestinationCount(value);
    },

    prepareModel: function () {
        return {
            inputCount: this.model.getSourceCount(),
            outputCount: this.model.getDestinationCount()
        };
    }
});