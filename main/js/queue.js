/*
	Basic Queue implementation is below, although the battlequeue does not use it; a priority queue is more appropriate
*/
function Node(value){
	this.next = null;
	this.value = value;
}
function Queue(){
	this.front = null;
	this.tail = null;
}
Queue.prototype = {
	"enqueue" : function(value){
		if(!value)
			return;

		var node = new Node(value);
		if(!this.front){
			this.front = this.tail = node;
		}else{
			this.tail.next = this.tail = node;
		}
	},
	"peek" : function(){
		if(!this.front)
			return null;
		return this.front.value;
	},
	"dequeue" : function(){
		if(!this.front)
			return null;
		var node = this.front.value;
		this.front = node.next; 

		return node;
	}
};

function BattleStatus(combatant){
	this.combatant = combatant;
	this.readiness = 0;
	this.status = 0;
	this.action = null;
}
BattleStatus.ENTERING_BATTLE = 0;
BattleStatus.WAITING = 0x0001;
BattleStatus.DECIDING = 0x0002;
BattleStatus.READY = 0x0004;
BattleStatus.ACTING = 0x0008;
BattleStatus.DEAD = 0x0080;

BattleStatus.compareStatus = function cmp(a,b){
	/*
		People move up the BATTLE QUEUE by being faster or ready to act.
	*/
	var aActionStatus = (a.status & 0x000F),
		bActionStatus = (b.status & 0x000F);

	if(a.status & BattleStatus.DEAD)	//Lucky number?
		aActionStatus = 7;

	if(b.status & BattleStatus.DEAD)
		bActionStatus = 7;	

	if(aActionStatus == bActionStatus && aActionStatus == BattleStatus.READY){
		return 0;
	}

	if(aActionStatus > bActionStatus)
		return -1;
	else if(aActionStatus < bActionStatus)
		return 1;

	var aSpeed = a.combatant.speed,
		bSpeed = b.combatant.speed;

	if(aSpeed > bSpeed)
		return -1;
	else if(aSpeed < bSpeed)
		return 1;

	return 0;
};
BattleStatus.prototype = {
	"setActionStatus" : function(newStatus){
		this.status &= (~0x000F);
		this.status |= newStatus;
		if(newStatus === BattleStatus.WAITING){
			if(!!this.combatant.sprite)
				this.combatant.sprite.setAnimation(0);
			this.readiness = 0;
		}
	},
	"setConditionStatus" : function(newStatus){
		this.status &= (~0x00F0);
		this.status |= newStatus;
	},
	"hasStatus" : function(status){
		return !!(this.status & status);
	},
	"setAction" : function(action, ability, targets){
		this.action = Object.create(action);
		this.action.onInit(this.combatant, ability, targets);
	},
	"onUpdate" : function(dT){
		if(this.status === 0){       //ENTERING BATTLE
			if(this.action.onUpdate(dT))
				this.setActionStatus(BattleStatus.WAITING);

		}else if(this.hasStatus(BattleStatus.WAITING)){      //WAITING TO MAKE A BATTLE DECISION
			this.readiness += this.combatant.speed * 0.003 * dT;
			if(this.readiness >= 1.0){
				this.readiness = 1;
				this.setActionStatus(BattleStatus.DECIDING);
			}
		}else if(this.hasStatus(BattleStatus.ACTING)){
			//onUpdate() returns true when the action is completed. Once that is the case, return to the waiting phase
			if(this.hasStatus(BattleStatus.DEAD)){
				return this.action.onUpdate(dT);	
			}else if(this.action.onUpdate(dT))
				this.setActionStatus(BattleStatus.WAITING);
		}
	}
};

/*
	BattleQueue keeps track of all combatants and their readiness to act,
	selected actions. It is not a 'queue' in the sense that it is not true FIFO.

	Only one combatant can act at a time. Combatants who are ready to act are
	moved to the front of the Queue. Right now this is handled with a sort,
	but can be potentially implemented as a heap
*/
function BattleQueue(){
	this.combatantStatuses = [];
}
BattleQueue.prototype = {
	"add" : function(combatant, enterAction){
		var i;
		if(typeof combatant.length !== 'undefined'){
			for(i = 0; i < combatant.length; ++i)
				this.add(combatant[i], enterAction);

			return;
		}

		var combatantEntry = new BattleStatus(combatant);
		if(!!enterAction)
			combatantEntry.setAction(enterAction);
		this.combatantStatuses.push(combatantEntry);
		//Sort by SPEED and READINESS TO ACT. People who are READY TO ACT
		//will skip over people who are still deciding
		this.combatantStatuses.sort(BattleStatus.compareStatus);
	},
	"onUpdate" : function(dT){
		var statuses = this.combatantStatuses;
		for(var i = 0; i < statuses.length; ++i){
			var combatantStatus = statuses[i];
			
			if(combatantStatus.onUpdate(dT)){
				//Combatant death animation complete
				this.removeCombatantFromQueue(statuses[i].combatant);				
				return; //Easier to just start this method all over
			}

			if(!!combatantStatus.combatant.ai && combatantStatus.hasStatus(BattleStatus.DECIDING)){
				//AI characters should decide their actions. TODO - Perhaps stagger time to decide?
				var aiCharacter = combatantStatus.combatant,
					aiDecision = aiCharacter.makeCombatDecision();

				this.prepareCombatantAction(aiCharacter, aiDecision.action, aiDecision.ability, aiDecision.targets);
			}
		}

		statuses.sort(BattleStatus.compareStatus);

		var nextInQueue = statuses[0];
		if(nextInQueue.hasStatus(BattleStatus.READY))
			nextInQueue.setActionStatus(BattleStatus.ACTING);
	},
	"getActivePartyMember" : function(party){
		var statuses = this.combatantStatuses;
		for(var i = 0; i < party.length; ++i){
			for(var j = 0; j < statuses.length; ++j){
				if(statuses[j].combatant === party[i] && statuses[j].hasStatus(BattleStatus.DECIDING))
					return party[i];
			}
		}
		return null;
	},
	"demoteCombatantCombatStatus" : function(combatant){
		var statuses = this.combatantStatuses;
		for(var i = 0; i < statuses.length; ++i){
			if(statuses[i].combatant === combatant){
				var newStatus = (statuses[i].status & 0x000F) >> 1;
				statuses[i].status &= (~0x000F);
				statuses[i].status |= newStatus;
				return;
			}
		}		
	},
	"removeCombatantFromQueue" : function(combatant){
		//eg. someone died or otherwise can't fight
		var statuses = this.combatantStatuses;
		for(var i = 0; i < statuses.length; ++i){
			if(statuses[i].combatant === combatant){
				this.combatantStatuses.splice(i, 1);
				return;
			}
		}		
	},
	"getCombatantIndex" : function(combatant){
		var statuses = this.combatantStatuses;

		for(var i = 0; i < statuses.length; ++i){
			if(statuses[i].combatant === combatant)
				return i;			
		}
		return -1;
	},
	"getCombatantReadiness" : function(combatant){
		var statuses = this.combatantStatuses;
		for(var i = 0; i < statuses.length; ++i){
			if(statuses[i].combatant === combatant)
				return statuses[i].readiness;
		}
		return 0;
	},
	"prepareCombatantDeath" : function(combatant){
		var index = this.getCombatantIndex(combatant);

		if(index === -1)
			return;

		var statuses = this.combatantStatuses;
		statuses[index].setAction(NPCDeathAction);
		statuses[index].setConditionStatus(BattleStatus.DEAD);
		statuses[index].setActionStatus(BattleStatus.ACTING);
		statuses.sort(BattleStatus.compareStatus);		
	},

	"prepareCombatantAction" : function(combatant, action, ability, targets){
		var index = this.getCombatantIndex(combatant);

		if(index === -1)
			return;

		var statuses = this.combatantStatuses;
		statuses[index].setAction(action, ability, targets);
		statuses[index].setActionStatus(BattleStatus.READY);

		statuses.sort(BattleStatus.compareStatus);
	},
	"renderCurrentAction" : function(renderingEngine, dT){
		var statuses = this.combatantStatuses;
		if(statuses[0].hasStatus(BattleStatus.ACTING))
			statuses[0].action.onRender(renderingEngine, dT);
	},
	"renderDyingNPCs" : function(renderingEngine, dT){
		var statuses = this.combatantStatuses;
		for(var i = 1; i < statuses.length; ++i){
			if(statuses[i].hasStatus(BattleStatus.DEAD)){
				statuses[i].combatant.render(renderingEngine, dT);
			}
		}		
	},
	"battleIsOver" : function(){
		var statuses = this.combatantStatuses;
		for(var i = 1; i < statuses.length; ++i){
			if(statuses[i].hasStatus(BattleStatus.DEAD)){
				return false;
			}
		}
		return true;
	}
};