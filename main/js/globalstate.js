/*
	Game Globals such as the game state machine, the active party, and funds.
*/
var GlobalState = (function(){
	var stateMachine = [],
		party = [],
		funds = 0;

	this.isRunning = function(){
		return !!stateMachine.length;
	};

	this.addPartyMember = function(newMember){
		var add = true;
		for(var i = 0; i < party.length; ++i){
			if(party[i].name === newMember.name){
				add = false;
				break;
			}
		}
		if(add)
			party.push(newMember);
	};

	this.forEachPartyMember = function(f){
		if(!f)
			return;

		for(var i = 0; i < party.length; ++i){
			f.call(party[i], i);
		}
	};

	this.getPrimaryPartyMember = function(){
		if(!party.length)
			return null;
		return party[0];
	};

	this.getActiveParty = function(){
		return party;
	};

	this.pushState = function(state, arg){
		state.onEnterState.call(this, arg);
		stateMachine.push(state);
	}.bind(this);

	this.popState = function(){
		stateMachine.pop();
	};

	this.getCurrentState = function(){
		return stateMachine[stateMachine.length - 1];
	};

	this.getStateMachine = function(){
		return stateMachine;
	};
	return this;
})();