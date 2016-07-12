(function(){
   function swap(array, a, b){
      var temp = array[a];
      array[a] = array[b];
      array[b] = temp;
   }
   function MaxHeap(){
      this.array = [null];
   }
   MaxHeap.prototype = {
      "push" : function(value){
          this.array.push(value);
          this.bubbleUp(this.array.length - 1);
      },
      "pop" : function(){
          if(this.array.length <= 1)
              return null;

          var value = this.array[1];
          this.array[1] = this.array[this.array.length - 1];
          this.array.pop();
          this.sinkDown(1);

          return value;
      },
      "sinkDown" : function(i){
          var value = this.array[i];

          while(i < this.array.length){
              var leftChild = i * 2,
                  rightChild = leftChild + 1,
                  swapIndex = null;
          
              if(leftChild < this.array.length){
                  if(this.array[leftChild] > value){
                      swapIndex = leftChild;
                  }
                  if(this.array[rightChild] > value && (swap === null || this.array[rightChild] > this.array[leftChild])){
                      swapIndex = rightChild;
                  }

                  if(!!swapIndex){
                      swap(this.array, i, swapIndex);
                      i = swapIndex * 2;
                  }else{
                     return;
                  }
              }
          }
       },
      "bubbleUp" : function(i){
          var value = this.array[i];
          
          var parent = Math.floor(i / 2);

          while(parent > 0){
             if(this.array[parent] < value){
                swap(this.array, parent, i);
                i = parent;
                parent = Math.floor(parent / 2);
             }else{
                return;
             }
          }
      }
   }
})();