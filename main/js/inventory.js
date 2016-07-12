var Inventory = (function(){
	var MAX_COUNT = 99;

	var items = [
		{"name" : 'Green Tea', "type" : 'heal', "power" : 500, "desc" : 'Restores 500 hp', "target" : 's'},
		{"name" : 'Angel Tears', "type" : 'revive', "desc" : 'Revives a fallen ally', "target" : 's'},
	];

	function ManagedInventory(){
		this.items = {};
		this.itemSlots = [];
	}
	ManagedInventory.prototype = {
		"addItem" : function(item, count){
			count = count || 1;

			if(!isNaN(item)){
				item = items[item];
			}

			var itemEntry;
			if(!this.items[item.name]){
				itemEntry = {"item" : item, "count" : count};
				this.items[item.name] = itemEntry;
				this.itemSlots.push(itemEntry)
			}else{
				this.items[item.name].count += count;
			}

			return this; //Allow chaining
		},

		"getItem" : function(slot){
			if(slot < 0 || slot >= this.itemSlots.length)
				return null;

			return this.itemSlots[slot].item;			
		},

		"consumeItem" : function(item, count){
			count = count || 1;

			if(!isNaN(item)){
				item = items[item];
			}

			if(!this.items[item.name])
				return;

			if( (this.items[item.name].count -= count) <= 0 ){
				var itemEntry = this.items[item.name];
				for(var i = 0; i < this.itemSlots.length; ++i){
					if(this.itemSlots[i] === itemEntry){
						this.itemSlots.splice(i,1);
						itemEntry = null;
						delete this.items[item.name];
						return;
					}
				}
			}
		},
		"getItemList" : function(){
			var items = [],
				itemSlots = this.itemSlots;
			for(var i = 0; i < itemSlots.length; ++i){
				var itemEntry;
				if(!!(itemEntry = itemSlots[i])){
					items.push(itemEntry.item.name + '  x' + itemEntry.count);
				}
			}
			return items;
		}
	};

	this.newInstance = function(){
		return new ManagedInventory();
	};

	return this;
})();