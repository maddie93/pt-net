var OptionsBaseView = require('./options_base');

module.exports = OptionsBaseView.extend({
    templateHTML: '<h3>Place</h3>'
    + '<li><label for="title">title: </label><input id="title" type="text" name="title" value="{{title}}"></li>'
    + '<li><label for="tokens">tokens: </label><input id="tokens" type="text" name="tokens" value="{{tokens}}"></li>',

    events: {
        'keyup input#title': 'onTitleChange',
        'keyup input#tokens': 'onTokensChange'
    },

    onTitleChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.setLabel(val);
    },

    onTokensChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.setTokens(val);
    },

    prepareModel: function () {
        var model = this.model;

        var preparedModel = {
            tokens: model.getTokens(),
            title: model.getLabel()
        };
        return preparedModel;
    }
});