(function( window, undefined ) {
	
	function elements(id) {
		return elements.array[id] || (elements.array[id] = document.getElementById(id));
	}
	elements.array = {};
	
	var library = {
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
			}
		},
		"coord": {
			getDistance: function (from, to) {
				return {
					"x": to.x - from.x,
					"y": to.y - from.y
				};
			},
			getRect: function (from, to) {
				return {
					"x": Math.min(from.x, to.x),
					"y": Math.min(from.y, to.y),
					"w": Math.abs(from.x - to.x),
					"h": Math.abs(from.y - to.y)
				};
			},
			isPointInRect: function (p, rect) {
				return rect.x < p.x && rect.y < p.y && rect.x + rect.w > p.x && rect.y + rect.h > p.y;
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

	function extend(libName) {
		return library[libName];
	}

	window.extend = extend;
	window.elements = elements;

})( window );
 	
    
