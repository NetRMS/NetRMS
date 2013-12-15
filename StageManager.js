(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
	
	/*
	 * StageManager
	 */
	
	function StageManager () {
	}
	StageManager.prototype = {
		initialize: function (stage) {
			this.stage = stage;
			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
			this.blocks = new BlockArray();
			
			this.canvas.style.position = "absolute";
			this.canvas.style.top = "0px";
			this.canvas.style.left = "0px";
		},
		clear: function () {
			this.context.clearRect(0, 0, this.canvas.width / this.stage.zoomValue, this.canvas.height / this.stage.zoomValue);
		},
		copy: function () {
			this.image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
		},
		load: function (x, y) {
			this.context.putImageData(this.image, x, y);
		},
		invalidate: function () {
			this.clear();
			
			for(var i=0, blocks=this.blocks, _i=blocks.size(); i<_i; i++) {
				this.drawBlock(blocks.get(i));
			}
		},

		/*
		 * Override
		 */
		set: function () {},
		drawBlock: function (block) {}
	};
	
	window.StageManager = StageManager;
	
}) (window);
