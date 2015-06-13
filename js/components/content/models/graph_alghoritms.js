var joint = require('jointjs');

module.exports = Backbone.Model.extend({
    createCoverityGraph: function(model){
        var statesList = this.createCoverityTree(model);
        var cells = this.mergeDuplicates(statesList);
        return cells;
    },

    mergeDuplicates: function(statesList){
        for(var i = 0; i < statesList.length; i++){
            for(var j = i+1; j < statesList.length; j++){
                if(statesList[i]!=undefined&&statesList[j]!=undefined&&this.areEqualStates(statesList[i],statesList[j])){
                    statesList[i].parent = statesList[i].parent.concat(statesList[j].parent);
                    this.switchChildsOfParent(statesList,statesList[j].id,statesList[i].id);
                    statesList[i].transition = statesList[i].transition.concat(statesList[j].transition);
                    statesList[j] = undefined;
                }
            }
        }
        return this.filterOutStates(statesList);
    },

    switchChildsOfParent: function(statesList,parentId,newId){
        _.each(statesList,function(entry){
            if(entry!=undefined){
                for(var i = 0; i< entry.parent.length; i++){
                    if(entry.parent[i]==parentId) entry.parent[i]=newId;
                }
            }
        });
    },

    filterOutStates: function(statesList){
        var filtered = [];
        _.each(statesList,function(entry){
            if(entry!=undefined) filtered.push(entry);
        });
        return filtered;
    },

    convertToGraph: function(statesList){
        var cellsArray = [];
        this.infinityPrinter(statesList);
        this.setStateTier(statesList);
        var tiers = this.countTiers(statesList);
        var widths = this.countWidthPerTier(tiers,1300);
        var heights = this.countHeightPerTier(tiers,800);
        var cellsCounter = [];
        var newCell = function(x,y,states){
            var cell = new joint.shapes.basic.Rect({
                position: {x: x, y: y },
                size: { width:100, height: 30},
                attrs: { text:{ text: states, fill: 'black'}},
                type: 'cell'
            });
            cell.stateId = states.id;
            cell.stateParent = states.parent;
            cell.stateTransition = states.transition;
            cellsArray.push(cell);
            return cell;
        };

        _.each(statesList,function(entry){
            var tier = entry.tier;
            if(cellsCounter[tier]==undefined) cellsCounter[tier]=0;
            else cellsCounter[tier]++;
            var width = (widths[tier]*2*cellsCounter[tier])+widths[tier];
            var height = (heights*2*tier)+heights
            newCell(width,height,entry);
        },this);
        _.each(statesList,function(entry) {
            for (var i = 0; i < entry.parent.length; i++) {
                var parent = entry.parent[i];
                if (parent != undefined) {
                    var target = this.findCellIdByStateId(entry.id, cellsArray)
                    var source = this.findCellIdByStateId(parent, cellsArray)
                    var edge = this.link(source, target, entry.transition[i]);
                    cellsArray.push(edge);
                }
            }
        },this);
        return cellsArray;
    },

    makeLegend: function(workModel){
        var places = this.getPlaces(workModel);
        var labels = [];
        _.each(places,function(entry){
            labels.push(entry.getLabel);
        });
        return labels;
    },

    infinityPrinter: function(statesList){
        for(var i =0; i< statesList.length; i++){
            var states = statesList[i];
            for(var j = 0; j < states.length; j++){
                if(states[j] == 999){
                    states[j]='\u221E';
                }
            }
        }
    },

    findCellIdByStateId: function(id,cells){
        var idTmp;
        _.each(cells,function(entry){
            if(entry.stateId==id) idTmp = entry.id;
        });
        return idTmp;
    },

    link: function(source,target,label){
        var cell = new joint.dia.Link({
            source: { id: source },
            target: { id: target },
            attrs: {
                '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' }
            },
            labels: [
                { position: .5, attrs: { text: { text: label } } }
            ],
            type: 'link'
        });
        return cell;
    },

    setStateTier: function(statesList){
        statesList[0].tier = 0;
        for(var i = 1; i < statesList.length; i++){
            var parent;
            var current = statesList[i];
            var j = 0;
            parent = this.findStateById(statesList,current.parent[0]);
            statesList[i].tier = parent.tier+1;
        }
    },

    findStateById: function(statesList, id){
        var state;
        _.each(statesList,function(entry){
            if(entry.id==id) state = entry;
        });
        return state;
    },

    countTiers: function(statesList){
        var tiers = [];
        _.each(statesList,function(entry){
            var tier = entry.tier;
            if(tiers[tier]==undefined) tiers[tier]=1;
            else tiers[tier]++
        });
        return tiers;
    },

    countWidthPerTier: function(tiers,maxWidth){
        var widths = [];
        var i;
        for(i=0; i < tiers.length; i++){
            widths[i]=maxWidth/(tiers[i]*2);
        }
        return widths
    },

    countHeightPerTier: function(tiers,maxHeight){
        return maxHeight/(tiers.length * 2);
    },

    createCoverityTree: function (model) {
        var workModel = jQuery.extend(true,{},model);
        var statesList = [];
        var id = 1;
        var states = this.getNetState(workModel);
        states.status = 'new';
        states.id = id++;
        states.parent = [];
        states.transition = [];
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
                tmpStates.transition=[entry.getLabel()];
                tmpStates.status = 'new';
                tmpStates.id = id++;
                tmpStates.parent = [firstNewStates.id];
                this.handleAccumulation(tmpStates,this.filterPath(tmpStates,statesList));
                statesList.push(tmpStates);
                this.statesToModel(workModel,firstNewStates);
            },this);
            firstNewStates.status = 'old'
        }
        this.statesToModel(workModel,statesList[0]);
        return statesList;
    },

    filterPath: function(state,statesList){
        var filtered = [];
        var tmp = state;
        while(tmp.parent[0]!=undefined){
            tmp = statesList[tmp.parent[0]-1];
            filtered.push(statesList[tmp.id-1]);
        }
        return filtered;
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
    },

    getStatePosition: function(state,statesList){
        var temp = -1;
        for (var i = 0; i < statesList.length; i++) {
            if(this.areEqualStates(state, statesList[i])){
                temp = i;
                break;
            }
        }
        return temp;
    },

    createReachabilityGraph: function (model) {
        var workModel = jQuery.extend(true,{},model);
        var statesList = [];
        var id = 1;
        var states = this.getNetState(workModel);
        var counter = 0;
        var statesPosition = -1;
        states.status = 'new';
        states.id = id++;
        statesList.push(states);
        while (this.isAnyNewStates(statesList) && counter < 20) {
            var firstNewStates = this.findFirstNewStates(statesList);
            this.statesToModel(workModel,firstNewStates);
            var activeTransitions = this.getActiveTransitions(workModel);
            if(activeTransitions.length==0) firstNewStates.status = 'end';
            _.each(activeTransitions,function(entry){
                this.fireTransition(workModel,entry);
                var tmpStates = this.getNetState(workModel);
                statesPosition = this.getStatePosition(tmpStates, statesList);
                if (statesPosition == -1) {
                    tmpStates.transition = [entry.getLabel()];
                    tmpStates.status = 'new';
                    tmpStates.id = id++;
                    tmpStates.parent = [firstNewStates.id];
                    statesList.push(tmpStates);
                    counter++;
                } else {
                    if (!_.contains(statesList[statesPosition].parents, firstNewStates.id)) {
                        if (statesList[statesPosition].parent == undefined) {
                            statesList[statesPosition].parent = [];
                            statesList[statesPosition].transition = [];
                        }
                        statesList[statesPosition].parent.push(firstNewStates.id);
                        statesList[statesPosition].transition.push(entry.getLabel());
                    }
                }
                this.statesToModel(workModel,firstNewStates);
            },this);
            firstNewStates.status = 'old';
        }
        this.statesToModel(workModel,statesList[0]);
        return statesList;
    },

    isDeadlockFree: function (statesList) {
        var isDeadlockFree = true;
        for(var i = 0; i < statesList.length; i++) {
            if (statesList[i].status == 'end') {
                isDeadlockFree = false;
                break;
            }
        }
        return isDeadlockFree;
    },

    getUpperBound: function (statesList) {
        var upperBound = 0;
        for (var i = 0; i < statesList.length; i++) {
            for (var j = 0; j < statesList[0].length; j++) {
                if (statesList[i][j] > upperBound) {
                    upperBound = statesList[i][j];
                }
            }
        }
        if (upperBound == 999) {
            return '\u221E';
        }
        return upperBound;
    },

    isSafe: function (statesList) {
        if (this.getUpperBound(statesList) == 1) {
            return true;
        }
        return false;
    },

    getPlacesBounds: function (statesList, model) {
        var upperBounds = [];
        var places = this.getPlaces(model);
        var k = 0;
        _.each(places, function (entry) {
            upperBounds[k++] = [entry.getLabel(), 0];
        });
        for (var i = 0; i < statesList.length; i++) {
            for (var j = 0; j < statesList[0].length; j++) {
                if (statesList[i][j] > upperBounds[j][1]) {
                    upperBounds[j][1] = statesList[i][j];
                }
            }
        }
        for (var i = 0; i < upperBounds.length; i++) {
            if (upperBounds[i][1] == 999) {
                upperBounds[i][1] = '\u221E';
            }
        }
        return upperBounds;
    },

    isPreservative: function (statesList) {
        var isPreservative = true;
        var sum = 0;
        var tSum = 0;
        for(var i = 0; i < statesList[0].length; i++) {
            sum += statesList[0][i];
        }
        for (var i = 0; i < statesList.length; i++) {
            tSum = 0;
            for(var j = 0; j < statesList[0].length; j++) {
                tSum += statesList[i][j];
            }
            if (tSum != sum) {
                isPreservative = false;
                break;
            }
        }
        return isPreservative;
    },

    reversibilityRecursiveClimber: function(statesList, checkedStatesList, reversibleStatesList, item) {
        var isReversible = false;
        var isNotLeaf = false;
        if (checkedStatesList[item]) {
            return reversibleStatesList[item];
        }
        checkedStatesList[item] = true;
        for(var i = 0; i < statesList.length; i++) {
            if(statesList[i].parent[0] == item+1) {
                reversibleStatesList[i] = this.reversibilityRecursiveClimber(statesList, checkedStatesList, reversibleStatesList, i);
                isReversible = isReversible || reversibleStatesList[i];
                isNotLeaf = true;
            }
        }
        if (isNotLeaf) {
            return isReversible;
        }
        _.each(statesList, function(entry) {
             if(this.areEqualStates(statesList[item], entry) && statesList[item].id != entry.id){
                reversibleStatesList[entry.id-1] = this.reversibilityRecursiveClimber(statesList, checkedStatesList, reversibleStatesList, entry.id-1);
                isReversible = isReversible || reversibleStatesList[entry.id-1];
             }
        }, this);
        return isReversible;
    },

    isReversible: function (statesList) {
        var reversibleStatesList = [];
        var checkedStatesList = []
        for (var i = 0; i < statesList.length; i++) {
            reversibleStatesList[i] = false;
            checkedStatesList[i] = false;
        }
        reversibleStatesList[0] = true;
        this.reversibilityRecursiveClimber(statesList, checkedStatesList, reversibleStatesList, 0);
        for (var i = 0; i < reversibleStatesList.length; i++) {
            if (!reversibleStatesList[i]) {
                return false;
            }
        }
        return true;
    },

    aliveTransitions: function (statesList, model) {
        var transitions = this.getTransitions(model);
        var transitionLabels = [];
        var aliveTransitionsList = [];
        var k = 0;
        _.each(transitions, function (entry) {
            aliveTransitionsList[k++] = [entry.getLabel(), false];
            transitionLabels.push(entry.getLabel());
        });
        _.each(statesList, function(entry) {
            if (entry.transition[0] != undefined) {
                aliveTransitionsList[transitionLabels.indexOf(entry.transition[0])][1] = true;
            }
        });
        return aliveTransitionsList;
    },

    livenessRecursiveClimber: function (statesList, checkedStatesList, aliveStateTransitionList, transitionLabels, item, tailRecursionList) {
        var isNotLeaf = false;
        if (checkedStatesList[item]) {
            _.each(tailRecursionList, function (entry) {
                for (var i = 0; i < transitionLabels.length; i++) {
                    aliveStateTransitionList[entry][i] = aliveStateTransitionList[entry][i] || aliveStateTransitionList[item][i];
                }
            });
            return;
        }
        tailRecursionList.push(item);
        for(var i = 0; i < statesList.length; i++) {
            if(statesList[i].parent[0] == item+1) {
                _.each(tailRecursionList, function (entry) {
                    if (statesList[i].transition[0] != undefined) {
                        aliveStateTransitionList[entry][transitionLabels.indexOf(statesList[i].transition[0])] = true;
                    }
                });
                this.livenessRecursiveClimber(statesList, checkedStatesList, aliveStateTransitionList, transitionLabels, i, tailRecursionList.slice());
                isNotLeaf = true;
            }
        }
        checkedStatesList[item] = true;
        if (isNotLeaf) {
            return;
        }
        _.each(statesList, function(entry) {
             if(this.areEqualStates(statesList[item], entry) && statesList[item].id != entry.id){
                this.livenessRecursiveClimber(statesList, checkedStatesList, aliveStateTransitionList, transitionLabels, entry.id-1, tailRecursionList.slice());
             }
        }, this);
        return;
    },

    isNetAlive: function (statesList, model) {
        var aliveStateTransitionList = [];
        var transitions = this.getTransitions(model);
        var transitionLabels = [];
        var checkedStatesList = [];
        var tailRecursionList = [];
        var k = 0;
        _.each(transitions, function (entry) {
            transitionLabels.push(entry.getLabel());
        });
        _.each(statesList, function(entry) {
            aliveStateTransitionList[k] = [];
            for(var i = 0; i < transitions.length; i++) {
                aliveStateTransitionList[k][i] = false;
            }
            checkedStatesList[k++] = false;
        });
        this.livenessRecursiveClimber(statesList, checkedStatesList, aliveStateTransitionList, transitionLabels, 0, tailRecursionList);
        for (var i = 0; i < aliveStateTransitionList.length; i++) {
            for (var j = 0; j < aliveStateTransitionList[0].length; j++) {
                if (!aliveStateTransitionList[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }
});