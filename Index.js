(function (window, undefined) {

	"use strict";

	var _ = extend("util");
	
	/*
	 * Index
	 */
	function Index () {}
	Index.prototype = {
		map: {
		},
		index: 1,
		set: function (block) {
			var index = _.numToRGBString(this.index++);
			this.map[index] = block;
			
			block.index = index;
		},
		get: function (rgb) {
			return this.map[_.arrayToRGBString(rgb)];
		}
	};
	
	window.Index = Index;
	
}) (window);
