(function (window, undefined) {

	"use strict";

	/*
	 * LinkObject
	 */
	function LinkObject() {
		this.initialize();
	}
	
	LinkObject.prototype = new BlockObject();
	
	LinkObject.prototype.initialize = function () {
			this.blocks = [];
			this.index = "#000000";
	};
	LinkObject.prototype.path = function (context) {
		context.beginPath();
		context.moveTo(this.blocks[0].x, this.blocks[0].y);
		context.lineTo(this.blocks[1].x, this.blocks[1].y);
		context.closePath();
	};

	window.LinkObject = LinkObject;
	
}) (window);
