/*
	CONTAINS EVERYTHING FOR BATTLES AND ENEMIES

	For brevity, this file also contains the list of spells
*/
/*
	BATTLE MENUS
*/

var BattleList = [
	['battle1.png', [{"index" : 0, "x":360, "y": 80},{"index" : 0, "x":430, "y": 230},{"index" : 0, "x":500, "y": 120}]],
	['battle1.png', [{"index" : 1, "x":360, "y": 245},{"index" : 1, "x":430, "y": 330}]]	
];
var ActionList = [
	'MAGIC',
	'ITEM',
];

/*
	Most of the spells include particle systems. Spells can potentially either be healing, offensive, or buffs
*/
var MagicList = [
	{"name" : 'Fire Storm', "type" : 'fire', "baseDamage" : 200, "offensive" : true, "target" : 'a', "cost" : 15, "desc" : 'Rain fire onto all enemies',
		"onRender" : function(renderingEngine, dT){
			if(!this.effect){
				this.effect = new ParticleSystem(0, -64, {
				"type" : 'directional',
				"direction" : {"x" : 0.5, "y" : 0.5}
				}, 1.25, 1.75, 0.02, 500, 80, 'fireball.png', 'flamesplash.png');
			}

			if(this.effect.onRender(renderingEngine, dT)){
				delete this.effect;
				return true;
			}
			return false;
		}
	},
	{"name" : 'Psyblast', "type" : 'psychic', "baseDamage" : 150, "offensive" : true, "target" : 's', "cost" : 8, "desc" : 'Single target psychic attack',
		"onRender" : function(renderingEngine, dT){
			if(!this.dX){
				this.x = this.owner.x + this.owner.direction * 32;
				this.y = this.owner.y + 32;
				this.dX = this.targets[0].x - this.owner.x;
				this.dY = this.targets[0].y - this.owner.y;

				var w = Math.sqrt(Math.pow(this.dX, 2) + Math.pow(this.dY, 2));
				this.dX /= w;
				this.dY /= w;

			}

			this.x += this.dX * dT * 400;
			this.y += this.dY * dT * 400;

			if(this.x >= this.targets[0].x + 32){
				delete this.x;
				delete this.y;
				delete this.dX;
				delete this.dY;
				return true;
			}

			renderingEngine.renderStaticSprite('psymissile.png', this.x, this.y);
			return false;		
		}
	},
	{"name" : 'Soul Spark', "type" : 'electric', "baseDamage" : 100, "offensive" : true, "target" : 's', "cost" : 8, "desc" : 'Ethereal burst of lightning',
		"onRender" : function(renderingEngine, dT){
			if(!this.effect){
				this.effect = new ParticleSystem(this.targets[0].x, 0, {
					"type" : 'point'
				}, 0.02, 0.15, 0.02, 35, 20, ['lightning.png', 'lightning2.png', 'lightning3.png'], null);
			}

			if(this.effect.onRender(renderingEngine, dT)){
				delete this.effect;
				return true;
			}
			return false;
		}
	}
];

/*
	The battle game state. Owns a battle queue, a reference to the current party,
	and enemies currently facing the player party
*/
var Battle = new (function(){
	var currentBattle,
		battleQueue,
		activeEnemies,
		activeParty,
		uiState,
		earnedXP,
		battleState;

	this.getAvailableTargets = function(){
		return activeEnemies.slice();
	};

	this.onEnterState = function(arg){
		uiState = [];
		currentBattle = arg;
		activeEnemies = [];
		activeParty = this.getActiveParty();
		earnedXP = 0;
		battleState = 0;  //0 = fighting, 1 = win, 2 = lose

		var i;
		for(i = 0; i < currentBattle[1].length; ++i){
			var enemyData = currentBattle[1][i];
			var enemy = Enemies[enemyData.index];

			var newEnemy = Enemy.getCloneInstance(enemy);
			newEnemy.x = enemyData.x;
			newEnemy.y = enemyData.y;

			newEnemy.addEnemy(activeParty);

			activeEnemies.push(newEnemy);
		}

		for(i = 0; i < activeEnemies.length; ++i){
			activeEnemies[i].addAlly(activeEnemies);
		}

		this.forEachPartyMember(function(index){			
			this.x = 70;
			this.y = 230;
		});

		battleQueue = new BattleQueue();
		battleQueue.add(activeParty, EnterFromLeftAction);
		battleQueue.add(activeEnemies, EnterFromRightAction);
	};

	//Stub, may or may not be implemented in the end
	this.onLeaveState = function(arg){

	};

	this.onKeydown = function(keycode, ev){
		if(!uiState.length)
			return;

		var uiPane = uiState[uiState.length - 1];

		//Still fighitng
		if(battleState == 0){
			if(keycode === 5){
				//CANCEL
				uiState.pop();

				//If we are cancelling all actions, then move the party member back in the queue
				if(uiState.length === 0)
					battleQueue.demoteCombatantCombatStatus(uiPane.owner);
			}else if(keycode === 4){
				//CONFIRM
				var option = uiPane.getSelectedOption();
				switch(uiPane.id){
					case 0:     //ACTION MENU (eg. ATTACk, MAGIC, etc.)
						if(option === 'MAGIC')
							uiState.push(new BattleMagicMenu(uiPane.owner, uiPane.owner.magic));
						break;
					case 1: 	//MAGIC SELECTION                                         //Default to party if not offensive... determine if spell targets all or single
						uiState.push(new TargetSelectionMenu(activeParty, activeEnemies, !option.offensive, option.target === 'a', uiPane.owner));
						break;
					case 10:  //SELECTED TARGET
						//Once we select a target, blow the entire battle UI stack
						var actionPane = uiState[uiState.length - 2];
						battleQueue.prepareCombatantAction(actionPane.owner, CastSpellAction, actionPane.getSelectedOption(), option);
						uiState = [];
						break;
					default:
						break;
				}
			}else{
				uiPane.onSelectChange(keycode);
			}
		}else{
			//Otherwise we're just looking at post battle info. Cycle through all the text boxes until we're ready to go back
			uiState.pop();			
			if(!uiState.length){
				EventDispatcher.dispatchStateCompleteEvent();
			}
		}
	};

	this.onGameplayEvent = function(ev){
		var detail = ev.detail;
		var i;

		if(detail.type === 'npcdeath'){
			battleQueue.prepareCombatantDeath(detail.npc);
			earnedXP += detail.npc.exp;

			for(i = 0; i < activeEnemies.length; ++i){
				if(activeEnemies[i] === detail.npc){
					activeEnemies.splice(i, 1);
					return;
				}
			}
		}else if(detail.type === 'battlevictory'){
			this.onBattleWon();
		}
	}.bind(this);

	this.onBattleWon = function(){
		//YOU SURVIVED!!! Good show!
		battleState = 1;

		
		uiState = [];
		uiState.push(new BasicAlertPrompt('Earned ' + earnedXP + ' exp'));		
	};

	this.onUpdate = function(dT){
		if(battleState === 0){
			battleQueue.onUpdate(dT);

			if(!uiState.length){
				var activePartyMember;
				if(!!(activePartyMember = battleQueue.getActivePartyMember(activeParty)))
					uiState.push(new SingleDirectionMenu(0, activePartyMember, activePartyMember.actions, 229, 394));
			}

			if(!activeEnemies.length && battleQueue.battleIsOver()){
				EventDispatcher.dispatchGameplayEvent('battlevictory');
			}
		}
	};

	this.onRender = function(renderingEngine, dT){
		var i;
		//Static Battle BG
		renderingEngine.renderStaticSprite(currentBattle[0], 0, 0);

		//Draw enemies and players
		for(i = 0; i < activeEnemies.length; ++i){
			activeEnemies[i].render(renderingEngine, dT);
		}
		this.forEachPartyMember(function(index){
			this.render(renderingEngine, dT);
		});

		battleQueue.renderDyingNPCs(renderingEngine, dT);

		battleQueue.renderCurrentAction(renderingEngine, dT);


		Combatant.renderDamageDisplays(renderingEngine, dT);
		/*
			Battle status
		*/	
		renderingEngine.renderWindow(0, 380, 225, 92);
		renderingEngine.renderWindow(217, 380, 100, 92);	

		this.forEachPartyMember(function(index){
			var y = 394 + index*14;
			
			renderingEngine.renderText(this.name, 20, y);
			renderingEngine.renderText('' + this.hp, 210, y, 'r');

			var readiness = battleQueue.getCombatantReadiness(this);

			if(readiness >= 1)
				renderingEngine.renderProgress(100, y + 1, 50, 10, readiness, "#0F0", "#FFF");
			else
				renderingEngine.renderProgress(100, y + 1, 50, 10, readiness, "#AAF", "#FFF");

			if(!!uiState.length && this === uiState[uiState.length - 1].owner){
				/*
					render cursor next to active member
				*/
				renderingEngine.renderStaticSprite('cursor.png', 10, y);
			}
		});

		if(!!uiState.length){
			uiState[uiState.length-1].onRender(renderingEngine, dT);
		}
	};

	return this;
})();