<!DOCTYPE HTML>
<html>
  <head>
    <style>
      div {
        margin: 0px;
        padding: 0px;
        width : 100px;
        height: 100px;
        background: yellow;
      }
    </style>
  </head>
  <body>
    <div id="container" onmousedown="down(event)"> </div>
  


<script>
function search (array, value, func) {
	function search(low, high) {
		if(low > high) {
			return low;
		}
		
		var middle = Math.round((low + high) / 2),
		element = array[middle],
		result = func(element);
		
		if(result > value) {
			return search(low, middle - 1);
		}
		else if(result < value) {
			return search(middle + 1, high);
		}
		else {
			return middle;
		}
	}
	
	return search(0, array.length - 1);
}

var array = [1,5,9,10, 14, 20];
console.log(search(array, 12, function(e){return e}));
console.log(search(array, 0, function(e){return e}));
console.log(search(array, 19, function(e){return e}));
</script>
  </body>
</html>
