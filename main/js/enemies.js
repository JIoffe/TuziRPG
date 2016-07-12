/*
	ENEMY AI 
*/

function Enemy(data){
	for(var key in data){
		if(data.hasOwnProperty(key)){
			this[key] = data[key];
		}
	}
	this.maxmp = this.mp || 0;
	this.maxhp = this.hp;
	this.magic = data.magic;

	this.allies = [];
	this.enemies = [];
}
Enemy.simpleAttack = {"target" : 's', "offensive" : true};
Enemy.getCloneInstance = function(data){
	return new Enemy(data);
}
Enemy.prototype = {
	"chooseTarget" : function(ability){
		if(ability.offensive){
			if(ability.target === 'a')
				return this.enemies;
			var randomIndex = Math.floor(Math.random() * this.enemies.length);
			return [this.enemies[randomIndex]];
		}
	},
	"chooseSpell" : function(){
		if(!this.magic)
			return null;

		return MagicList[this.magic[Math.floor(Math.random() * this.magic.length)]];
	},
	/*
		At the moment, the AI combat decisions are not very involved...
		just randomly choose a party member, and either attack or cast a spell
		There is potential for "healing" and other archetypes
	*/
	"makeCombatDecision" : function(){
		var decision = {};

		if(this.ai === 'aggressive'){
			if(!!this.magic && (Math.random() <= this.spellChance)){
				decision.ability = this.chooseSpell();
				decision.targets = this.chooseTarget(decision.ability);
				decision.action = CastSpellAction;
			}else{
				//Let's get physical.
				decision.targets = this.chooseTarget(Enemy.simpleAttack);
				decision.action = BasicAttackAction;
			}
		}

		return decision;
	},
	"addAlly" : function(ally){
		if(typeof ally.length !== 'undefined'){
			for(var i = 0; i < ally.length; ++i){
				this.addAlly(ally[i]);
			}
		}
		this.allies.push(ally);
	},
	"addEnemy" : function(enemy){
		if(typeof enemy.length !== 'undefined'){
			for(var i = 0; i < enemy.length; ++i){
				this.addEnemy(enemy[i]);
			}
			return;
		}
		this.enemies.push(enemy);
	},
	"takeDamage" : function(attacker, amount, type, direction){
		Combatant.prototype.takeDamage.call(this, attacker, amount, type, direction);
		if(!this.isAlive()){
			EventDispatcher.dispatchNPCDeathEvent(this);
		}
	},
	"getImage" : function(){
		return this.img;
	},
	"render" : function(renderingEngine, dT){
		Combatant.prototype.onRender.call(this, renderingEngine, dT);
	},
	"isAlive" : function(){
		return this.hp > 0;
	}
};

var Enemies = [
	{"name" : 'Enemy Eye', "img" : 'evileye.png', "level" : 20, "exp" : 35, "hp" : 80, "attack" : 50, "strength" : 40, "magpower" : 140, "speed" : 80, "mp" : 200, "def" : 45, "mdef" : 90, "ai" : 'aggressive', "spellChance" : 0.75, "magic" : [2]},
	{"name" : 'Sewer Monster', "img" : 'sewermonster.png', "level" : 25, "exp" : 90, "hp" : 200, "attack" : 90, "strength" : 60, "speed" : 50, "def" : 45, "mdef" : 90, "ai" : 'aggressive', "spellChance" : 0},
];