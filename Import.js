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
				return "#"+ this.numToHexCh((n >> 16) & 255) + this.numToHexCh((n >> 8) & 255) + this.numToHexCh(n & 255);
			},
			numToHexCh : function (n) {
				var s = n.toString(16);
				
				return s.length == 1? "0"+s: s;
			},
			arrayToRGBNumber : function (array) {
				return array[0]<<16 | array[1]<<8 | array[2];
			}
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
 	
    
