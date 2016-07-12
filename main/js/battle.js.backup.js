/*
	CONTAINS EVERYTHING FOR BATTLES AND ENEMIES
*/
/*
	BATTLE MENUS
*/

var BattleList = [
	['battle1.png', [{"index" : 0, "x":180, "y": 40},{"index" : 0, "x":215, "y": 115},{"index" : 0, "x":260, "y": 60}]]
];
var ActionList = [
	'MAGIC',
	'ITEM',
];
var MagicList = [
	{"name" : 'Fire Storm', "type" : 'fire', "baseDamage" : 200, "offensive" : true, "target" : 'a', "cost" : 15, "desc" : 'Rain fire onto all enemies'},
	{"name" : 'Spirit Bomb', "type" : 'psychic', "baseDamage" : 150, "offensive" : true, "target" : 's', "cost" : 8, "desc" : 'Single target psychic attack'},
	{"name" : 'Soul Spark', "type" : 'electric', "baseDamage" : 100, "offensive" : true, "target" : 's', "cost" : 8, "desc" : 'Ethereal burst of lightning'}
];

function DamageReport(dmg, x, y){
	this.dmg = dmg;
	this.elapsedTime = 0;
	this.x = x;
	this.y = y;
}
DamageReport.prototype = {
	"onRender" : function(renderingEngine, dT){
		this.elapsedTime += dT;
		if(this.elapsedTime > 1)
			return true;

		this.y += dT * 20;

		renderingEngine.renderText('' + this.dmg, this.x, this.y, 'c');
		return false;
	}
};

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
			this.x = 40;
			this.y = 70;
		});

		battleQueue = new BattleQueue();
		battleQueue.add(activeParty, EnterFromLeftAction);
		battleQueue.add(activeEnemies, EnterFromRightAction);
	};

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
			//Otherwise we're just looking at info
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
					uiState.push(new SingleDirectionMenu(0, activePartyMember, activePartyMember.actions, 240, 194));
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
		battleQueue.renderDyingNPCs(renderingEngine, dT);

		this.forEachPartyMember(function(index){
			this.render(renderingEngine, dT);
		});

		battleQueue.renderCurrentAction(renderingEngine, dT);

		Combatant.renderDamageDisplays(renderingEngine, dT);
		/*
			Battle status
		*/	
		renderingEngine.renderStaticSprite('bottomstatuswindow.png', 0, 189);
		renderingEngine.renderStaticSprite('bottomactionwindow.png', 231, 189);	

		this.forEachPartyMember(function(index){
			var y = 194 + index*14;
			
			renderingEngine.renderText(this.name, 20, y);
			renderingEngine.renderText(''+this.hp, 165, y, 'r');
			var readiness = battleQueue.getCombatantReadiness(this);

			if(readiness >= 1)
				renderingEngine.renderProgress(174, y+1, 50, 10, readiness, "#0F0", "#FFF");
			else
				renderingEngine.renderProgress(174, y+1, 50, 10, readiness, "#AAF", "#FFF");

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