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
		StageManager.prototype.initialize.call(this, stage);
		
		stage.on("add", this.onAddBlock.bind(this));
		stage.on("invalidate", this.invalidate.bind(this));
		stage.on("dragend", this.onDragEnd.bind(this));
	};
	TraceManager.prototype.set = function () {
	};
	TraceManager.prototype.drawBlock = function (block) {
		var context = this.context, rect = block.rect;
		
		context.beginPath();
		context.rect(rect.x - rect.w/2, rect.y -rect.h/2, rect.w, rect.h);
		context.closePath();
		
		context.fillStyle = block.index;
		context.fill();
	};
	
	/*
	 * Event handler
	 */
	
	TraceManager.prototype.onAddBlock = function (event) {
		this.drawBlock(event.block);
	};
	TraceManager.prototype.onDragEnd = function (event) {
		if (event.mode != Stage.MODE_MOVE) {
			return;
		}
		
		this.clear();
		
		this.invalidate();
	};
	
	/*
	 * Method
	 */
	
	window.TraceManager = TraceManager;

}) (window);
