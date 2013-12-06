(function( window, undefined ) {

	var libPool = {
		"class" : {
			hasClass: function(e, s) {
				return new RegExp("(?:^|\\s+)" + s + "(?:\\s+|$)").test(e.className);
			},
			addClass: function(e, s) {
				if (!this.hasClass(e, s)) {
					e.className = e.className ? [e.className, s].join(' ') : s;
				}
			},
			removeClass: function(e, s) {
				if (this.hasClass(s)) {
					e.className = e.className.replace(new RegExp("(?:^|\\s+)" + s + "(?:\\s+|$)", "g"), "");
				}
			}
		},
		"net" : {
			isValidIPAddress: function(ip) {
				return ip.match(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)? true: false;
			},
		},
		"util" : {
			numToRGBString : function (n) {
				if(n > 0xffffff) throw ("invalid arguments "+ n);
				
				return "#"+ (1 << 24 | n).toString(16).substring(1);
			},
			arrayToRGBNumber : function (array) {
				return array[0]<<16 | array[1]<<8 | array[2];
			},
			arrayToRGBString: function (array) {
				return "#"+ (1 << 24 | array[0]<<16 | array[1]<<8 | array[2]).toString(16).substring(1);
			},
			isPointInRect: function (p, p1, p2) {
				var lowX , lowY, highX, highY;
				
				if(p1.x < p2.x) {
					lowX = p1.x;
					highX = p2.x;
				}
				else {
					lowX = p2.x;
					highX = p1.x;
				}
				
				if(p1.y < p2.y) {
					lowY = p1.y;
					highY = p2.y;
				}
				else {
					lowY = p2.y;
					highY = p1.y;
				}
				
				return lowX < p.x && lowY < p.y && highX > p.x && highY > p.y;
			},
			search: function (array, value, func) {
				function _search(low, high) {
					if(low > high) {
						return low;
					}
					
					var middle = Math.round((low + high) / 2),
					element = array[middle],
					result = func(element);
					
					if(result > value) {
						return _search(low, middle - 1);
					}
					else if(result < value) {
						return _search(middle + 1, high);
					}
					else {
						return middle;
					}
				}
				
				return _search(0, array.length - 1);
			},
			
		}
	};

	function extend(o, libName) {
		var lib = libPool[libName];
		if(lib) {
			for(var func in lib) {
				o[func] = lib[func];
			}
		}
	}

	window.extend = extend;

})( window );
 	
    
