
module.exports = Backbone.Model.extend({
    createCoverityTree: function (model) {
        var workModel = jQuery.extend(true,{},model);
        var statesList = [];
        var id = 1;
        var states = this.getNetState(workModel);
        states.status = 'new';
        states.id = id++;
        statesList.push(states);
        while (this.isAnyNewStates(statesList)) {
            var firstNewStates = this.findFirstNewStates(statesList);
            this.statesToModel(workModel,firstNewStates);
            if(this.isStatesDuplicate(firstNewStates,statesList)){
                firstNewStates.status = 'old';
                continue;
            }
            var activeTransitions = this.getActiveTransitions(workModel);
            if(activeTransitions.length==0) firstNewStates.status = 'end';
            _.each(activeTransitions,function(entry){
                this.fireTransition(workModel,entry);
                var tmpStates = this.getNetState(workModel);
                this.handleAccumulation(tmpStates,statesList);
                tmpStates.transition=entry.getLabel();
                tmpStates.status = 'new';
                tmpStates.id = id++;
                tmpStates.parent = firstNewStates.id;
                statesList.push(tmpStates);
                this.statesToModel(workModel,firstNewStates);
            },this);
            firstNewStates.status = 'old'
        }
        this.statesToModel(workModel,statesList[0]);
    },

    handleAccumulation: function(state,stateList){
        _.each(stateList,function(entry){
            if(!this.hasLowerState(state,entry) && this.hasLowerState(entry,state) && !this.areEqualStates(state,entry)){
                for(var i = 0; i<state.length;i++){
                    if(state[i]>entry[i]){
                        state[i] = 999;
                    }
                }
            }
        },this);

    },

    hasLowerState: function(base, checked){
        isLower = false;
        for(var i = 0; i < base.length; i++){
            if(base[i]<checked[i]){
                isLower = true;
                break;
            }
        }
        return isLower;
    },

    fireTransition: function(workModel,transition){
        this.setInLinks(transition,workModel);
        this.setOutLinks(transition,workModel);
        _.each(transition.inLinks,function(entry){
            var cell = workModel.getCell(entry.get('source'));
            if(cell.getTokens()!=999){
                cell.subtractTokens(entry.getCount());
            }

        });
        _.each(transition.outLinks,function(entry){
            var cell = workModel.getCell(entry.get('target'));
            if(cell.getTokens()!=999){
                cell.addTokens(entry.getCount());
            }
        });

    },

    statesToModel: function(workModel,states){
        var places = this.getPlaces(workModel);
        var i = 0;
        _.each(places,function(entry){
            entry.setTokens(states[i++]);
        });
    },

    isStatesDuplicate: function(state,statesList){
        var isDuplicate = false;
        _.each(statesList,function(entry){
            if(this.areEqualStates(state, entry)&&state.id!=entry.id&&entry.status!='new'){
                isDuplicate = true;
            }
        },this);
        return isDuplicate;
    },

    areEqualStates: function(state1,state2){
        var equal=true;
        for(var i = 0; i<state1.length; i++){
            if(state1[i]!=state2[i]){
                equal=false;
                break;
            }
        }
        return equal;
    },

    findFirstNewStates: function(statesList) {
        var i = 0;
        while (statesList[i].status != 'new') i++;
        return statesList[i];
    },

    isAnyNewStates: function (statesList) {
        var isNew = false;
        _.each(statesList, function (entry) {
            isNew = entry.status == 'new' || isNew;
        });
        return isNew;
    },

    getNetState: function (workModel) {
        var places = this.getPlaces(workModel);
        var states = [];
        _.each(places, function (entry) {
            var state = entry.attributes.tokens;
            states.push(state);
        });
        return states;
    },

    getPlaces: function (workModel) {
        var cells = workModel.get('cells').models;
        var places = [];
        _.each(cells, function (entry) {
            if (entry.attributes.type == "pn.Place") {
                places.push(entry);
            }

        });
        return places;
    },

    getTransitions:function (workModel){
      var allTransitions = workModel.get('transitions');
        var transitions = [];
        _.each(allTransitions,function (entry){
            if(entry.collection!=undefined) transitions.push(entry);
        });
        return transitions
    },

    getActiveTransitions: function (workModel) {
        var transitions = this.getTransitions(workModel);
        var activeTransactions = [];
        this.setInLinksForAllTransitions(transitions, workModel);
        _.each(transitions, function (entry) {
            if (this.isTransitionActive(entry, workModel)) {
                activeTransactions.push(entry);
            }
        }, this);
        return activeTransactions;
    },

    setInLinksForAllTransitions: function (transitions, workModel) {
        _.each(transitions, function (entry) {
            this.setInLinks(entry, workModel)
        }, this);
    },

    setInLinks: function (transition, workModel) {
        var inLinks = [];
        var allLinks = workModel.getLinks();
        _.each(allLinks, function (entry) {
            if (this.isPointingToTransition(entry, transition)) {
                inLinks.push(entry);
            }
        }, this);
        transition.inLinks = inLinks;
    },

    setOutLinks: function (transition, workModel) {
        var outLinks = [];
        var allLinks = workModel.getLinks();
        _.each(allLinks, function (entry) {
            if (this.isPointingFromTransition(entry, transition)) {
                outLinks.push(entry);
            }
        }, this);
        transition.outLinks = outLinks;
    },

    isPointingToTransition: function (entry, transition) {
        return entry.attributes.target.id == transition.id
    },

    isPointingFromTransition: function(entry, transition){
        return entry.attributes.source.id == transition.id;
    },

    isTransitionActive: function (transition, workModel) {
        var active = true;
        _.each(transition.inLinks, function (link) {
            var place = workModel.getCell(link.attributes.source.id);
            if (place.attributes.tokens < link.getCount()) {
                active = false;
            }
        });
        return active;
    }
});