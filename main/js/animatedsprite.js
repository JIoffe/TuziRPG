/*
	Animation List contains an array of arrays that include stand and end indexes for each animation
	This can be reused amongst similar sprites eg. humanoids in a JRPG
*/
function AnimatedSprite(img, animationList, animationSpeed, width, height){
	this.img = img;
	this.animationList = animationList || [];
	this.animationSpeed = animationSpeed || 4;

	this.width = width;
	this.height = height;

	this.currentAnimation = animationList.length > 0 ? animationList[0] : null;
	this.currentFrame = this.currentAnimation[0];
}
AnimatedSprite.prototype = {
	"update" : function(deltaSeconds){
		var currentAnimation;
		if(!(currentAnimation = this.currentAnimation) || currentAnimation.length === 1)
			return;
		this.currentFrame += this.animationSpeed * deltaSeconds;
		if(this.currentFrame > currentAnimation[1]){
			this.currentFrame = currentAnimation[0];
		}
	},
	"getAnimationIndex" : function(){
		if(!this.currentAnimation)
			return -1;
		for(var i = 0; i < this.animationList.length; ++i){
			if(this.currentAnimation === this.animationList[i])
				return i;
		}
	},
	"setAnimation" : function(i){
		if(this.animationList.length <= i || this.currentAnimation === this.animationList[i])
			return;
		this.currentAnimation = this.animationList[i];
		this.currentFrame = this.currentAnimation[0];
	},
	"setStillAnimation" : function(){
		for(var i = 1; i < this.animationList.length; i+=2){
			if(this.animationList[i] === this.currentAnimation){
				this.setAnimation(i - 1);
				return;
			}
		}
	}
};