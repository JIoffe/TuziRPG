var playerCharacterAnimationList = [
	[0],		//STANDING RIGHT
	[1,8],		//MOVING RIGHT
	[9],		//STANDING LEFT
	[10,17],	//MOVING LEFT
	[18],		//STANDING UP
	[19,26],	//MOVING UP
	[27],		//STANDING DOWN
	[28,35],	//MOVING DOWN
];
var PlayableCharacters = (function(){
	/*
		All humanoids share a common animation set
	*/


	function PlayerCharacter(name, hp, mp, image, battleSprite){
		this.level = 15;
		this.exp = 0;
		this.name = name;
		this.maxhp = this.hp = hp;
		this.maxmp = this.mp = mp;
		this.sprite = new AnimatedSprite('tuzi.png', playerCharacterAnimationList, 10, 24, 48);
		this.battleSprite = battleSprite;
		this.readiness = 0;
	}
	PlayerCharacter.prototype = {
		"update" : function(dT){
			
		},
		"render" : function(renderingEngine, dT){
			Combatant.prototype.onRender.call(this, renderingEngine, dT);
		},
		"takeDamage" : function(attacker, amount, type, direction){
			Combatant.prototype.takeDamage.call(this, attacker, amount, type, direction);
		},
		"isAlive" : function(){
			return this.hp > 0;
		},
		"setStats" : function(stats){
			for(var stat in stats){
				if(stats.hasOwnProperty(stat)){
					this[stat] = stats[stat];
				}
			}
		},
		"getImage" : function(){
			return this.battleImage;
		},
		"getDirection" : function(){
			var spriteAnimationIndex = this.sprite.getAnimationIndex();
			if(spriteAnimationIndex === 0 || spriteAnimationIndex === 1)
				return {"x": 1.0, "y" : 0};
			if(spriteAnimationIndex === 2 || spriteAnimationIndex === 3)
				return {"x": 0.0, "y" : -1.0};
			if(spriteAnimationIndex === 4 || spriteAnimationIndex === 5)
				return {"x": -1.0, "y" : 0};
			if(spriteAnimationIndex === 6 || spriteAnimationIndex === 7)
				return {"x": 0.0, "y" : 1.0};											
		}
	};

	this.TUZI = new PlayerCharacter('Tuzi', 4500, 300, 'tuzi.png');
	this.TUZI.actions = ['MAGIC', 'ITEMS', 'DEFEND'];
	this.TUZI.magic = [0,1];
	this.TUZI.battleImage = 'tuzi_battle.png';
	this.TUZI.setStats({
		"def" : 50,
		"mdef" : 100,
		"strength" : 80,
		"magpower" : 120,
		"speed" : 100
	});
	return this;
})();