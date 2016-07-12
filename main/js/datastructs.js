/*
	MIN HEAP
*/
function MinHeap(compareFunc){
	this.content = [];

	if(!!compareFunc)
		this.compareFunc = compareFunc;
	else{
		this.compareFunc = function(a, b){
			if(a == b)
				return 0;
			if(a < b)
				return -1;
			return 1;
		};
	}
}

MinHeap.prototype = {
	"size" : function(){
		return this.content.length;
	},
	"push" : function(value){
		this.content.push(value);
		this.bubbleUp(this.content.length - 1);
	},
	"peek" : function(){
		return this.content[0];
	},
	"pop" : function(){
		var value = this.content[0],
		endValue = this.content.pop();

		if(this.content.length > 0){
			this.content[0] = endValue;
			this.sinkDown(0);
		}

		return value;
	},
	"remove" : function(value){
		var length = this.content.length;
		for( var i = 0; i < length; ++i){
			if(this.content[i] !== value)
				continue;

			var end = this.content.pop();

			if(i === length - 1)
				break;

			this.content[i] = end;
			this.bubbleUp(i);
			this.sinkDown(i);

			break;
		}
	},
	"bubbleUp" : function(i){
		var value = this.content[i];
		while(i > 0){
			var parentIndex = Math.floor( (i+1)/2) - 1,
				parentValue = this.content[parentIndex];

			//Discontinue checking if heap is satisfied
			if(this.compareFunc(parentValue, value) < 1)
				break;

			this.content[parentIndex] = value;
			this.content[i] = parentValue;
			i = parentIndex;
		}
	},
	"sinkDown" : function(i){
		var length = this.content.length,
		value = this.content[i];

		while(i < length){
			var rightChildIndex = (i + 1) * 2,
				leftChildIndex = rightChildIndex - 1,

			swap = null;

			if(leftChildIndex < length){
				var leftChildValue = this.content[leftChildIndex];

				if(this.compareFunc(leftChildValue, value) < 1)
					swap = leftChildIndex;

				if(rightChildIndex < length){
					var rightChildValue = this.content[rightChildIndex];

					if(this.compareFunc(rightChildIndex, (swap === null ? value : leftChildValue)) < 1)
						swap = rightChildIndex;
				}
			}

			if(swap === null) break;

			this.content[i] = this.content[swap];
			this.content[swap] = value;
			i = swap;
		}
	}
};