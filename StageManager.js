(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
	
	/*
	 * StageManager
	 */
	
	function StageManager () {
	}
	StageManager.prototype = {
		initialize: function () {
			this.canvas = document.createElement("canvas");
			this.context = this.canvas.getContext("2d");
			this.blocks = new BlockArray();
			this.zoom = 1;
			/*
			this.canvas.style.position = "absolute";
			this.canvas.style.top = "0px";
			this.canvas.style.left = "0px";*/
		},
		clear: function () {
			this.context.clearRect(0, 0, this.canvas.width / this.zoom, this.canvas.height / this.zoom);
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
				this.drawItem(blocks.get(i));
			}
		},
		reset: function (width, height, zoom) {
			this.canvas.width = width;
			this.canvas.height = height;
			this.zoom = zoom;
			this.context.scale(zoom, zoom);
			this.set();
			this.invalidate();
		},
		getZoomRect: function (rect) {
			return {
				"x": rect.x / this.zoom,
				"y": rect.y / this.zoom,
				"w": rect.w / this.zoom,
				"h": rect.h / this.zoom
			};
		},
		getZoomDistance: function (distance) {
			return {
				"x": Math.floor(distance.x / this.zoom),
				"y": Math.floor(distance.y / this.zoom)
			};
		},

		/*
		 * Override
		 */
		
		set: function () {},
		drawItem: function (block) {}
	};
	
	window.StageManager = StageManager;
	
}) (window);
