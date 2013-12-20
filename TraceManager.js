(function (window, undefined) {

	"use strict";
	
	//var _ = extend("util");
	
	function TraceManager (stage) {
		this.initialize(stage);
	}
	
	/*
	 * Extend
	 */
	
	TraceManager.prototype = new StageManager();
	
	/*
	 * Override
	 */
	
	TraceManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this);
		
		stage.on("block", this.onAddBlock.bind(this));
		stage.on("link", this.onAddLink.bind(this));
		stage.on("invalidate", this.invalidate.bind(this));
		stage.on("stagemoveend", this.onDragEnd.bind(this));
		stage.on("blockmoveend", this.onDragEnd.bind(this));
		stage.on("reset", this.onReset.bind(this));
	};
	
	/*
	 * Event handler
	 */
	
	TraceManager.prototype.onAddBlock = function (event) {
		this.drawItem(event.block);
	};
	TraceManager.prototype.onAddLink = function (event) {
		this.drawItem(event.link);
	};
	TraceManager.prototype.onDragStart = function (event) {
		if (event.block && event.cursor == "crosshair") {
			
		}else {
			this.copy();
			this.clear();
		}
	};
	TraceManager.prototype.onDragEnd = function (event) {
		this.invalidate();
	};
	TraceManager.prototype.onReset = function (event) {
		this.reset(event.width, event.height, event.zoom);
	};
	
	/*
	 * Override
	 */
	
	TraceManager.prototype.set = function () {
	};
	TraceManager.prototype.drawItem = function (item) {
		item.path(this.context);
		
		this.context.fillStyle = item.index;
		this.context.fill();
	};
	
	/*
	 * Method
	 */
	
	TraceManager.prototype.getTrace = function (pos) {
		return this.context.getImageData(pos.x, pos.y, 1, 1).data;
	};
	
	window.TraceManager = TraceManager;

}) (window);
