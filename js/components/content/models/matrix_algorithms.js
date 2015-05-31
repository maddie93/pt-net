module.exports = Backbone.Model.extend({
    createDInputMatrix: function (model) {
        var inMatrix = [];
        var inbound;
        var placesBefore;
        var x = 0;
        var y = 0;
        var transitions = [];
        var cells = model.get('cells').models;
        var places = [];

        cells.forEach(function (entry) {
            if (entry.attributes.type == "pn.Place") {
                places[x++] = entry;
            } else if (entry.attributes.type == "pn.Transition") {
                transitions[y++] = entry;
            }
        });
        x = 1;
        inMatrix[0] = [];
        for (var i = 1; i <= transitions.length; i++) {
            inMatrix[i] = [];
            for (var j = 1; j <= places.length; j++) {
                inMatrix[i][j] = 0;
            }
        }
        inMatrix[0][0] = '\\';
        places.forEach(function (entry) {
            inMatrix[0][x++] = entry.get('attrs')['.label'].text;
        });
        x = 1;
        transitions.forEach(function (entry) {
            inMatrix[x++][0] = entry.get('attrs')['.label'].text;
        });
        x = 1;
        for (var i = 0; i < transitions.length; i++) {
            inbound = model.getConnectedLinks(transitions[i], {inbound: true});
            placesBefore = _.map(inbound, function (link) {
                return model.getCell(link.get('source').id);
            }, this);
            for (var j = 0; j < placesBefore.length; j++) {
                inMatrix[x][places.indexOf(placesBefore[j]) + 1] = inbound[j].getCount();
            }
            x++;
        }
        return inMatrix;
    },

    createDOutputMatrix: function (model) {
        var outMatrix = [];
        var outbound;
        var placesAfter;
        var x = 0;
        var y = 0;
        var transitions = [];
        var cells = model.get('cells').models;
        var places = [];

        cells.forEach(function (entry) {
            if (entry.attributes.type == "pn.Place") {
                places[x++] = entry;
            } else if (entry.attributes.type == "pn.Transition") {
                transitions[y++] = entry;
            }
        });
        x = 1;
        outMatrix[0] = [];
        for (var i = 1; i <= transitions.length; i++) {
            outMatrix[i] = [];
            for (var j = 1; j <= places.length; j++) {
                outMatrix[i][j] = 0;
            }
        }
        outMatrix[0][0] = '\\';
        places.forEach(function (entry) {
            outMatrix[0][x++] = entry.get('attrs')['.label'].text;
        });
        x = 1;
        transitions.forEach(function (entry) {
            outMatrix[x++][0] = entry.get('attrs')['.label'].text;
        });
        x = 1;
        for (var i = 0; i < transitions.length; i++) {
            outbound = model.getConnectedLinks(transitions[i], {outbound: true});
            placesAfter = _.map(outbound, function (link) {
                return model.getCell(link.get('target').id);
            }, this);
            for (var j = 0; j < placesAfter.length; j++) {
                outMatrix[x][places.indexOf(placesAfter[j]) + 1] = outbound[j].getCount();
            }
            x++;
        }
        return outMatrix;
    },

    createDMatrix: function (model) {
        var outMatrix = this.createDOutputMatrix(model);
        var inMatrix = this.createDInputMatrix(model);
        var dMatrix = [];

        dMatrix[0] = inMatrix[0];
        for (var i = 1; i < outMatrix.length; i++) {
            dMatrix[i] = [];
            for (var j = 1; j < outMatrix[0].length; j++) {
                dMatrix[i][j] = outMatrix[i][j] - inMatrix[i][j];
            }
        }
        for (var i = 1; i < inMatrix.length; i++) {
            dMatrix[i][0] = inMatrix[i][0];
        }
        return dMatrix;
    }
});