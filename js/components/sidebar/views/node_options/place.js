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
        var attributes = this.model.get('attrs');
        var val = $(e.currentTarget).val();
        attributes['.label'].text = val;
        this.model.unset('attrs');
        this.model.set('attrs', attributes);
    },

    onTokensChange: function (e) {
        var val = $(e.currentTarget).val();
        this.model.set('tokens', val);
    },

    prepareModel: function () {
        var model = this.model,
            attributes = model.get('attrs');

        var preparedModel = {
            tokens: model.get('tokens'),
            title: attributes['.label'].text
        };
        return preparedModel;
    }
});