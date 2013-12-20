(function (window, undefined) {

	"use strict";

	var _ = extend("util");
	
	/*
	 * Index
	 */
	function IndexObject () {}
	IndexObject.prototype = {
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
	
	window.IndexObject = IndexObject;
	
}) (window);
