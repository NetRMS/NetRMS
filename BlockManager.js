(function (window, undefined) {

	"use strict";

	//var _ = extend("util");

	/*
	 * BlockManager
	 */
	
	function BlockManager (stage) {
		this.initialize(stage);
	}
	/*
	 * Extend
	 */
	BlockManager.prototype = new StageManager();
	/*
	 * Override
	 */
	BlockManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this, stage);
		
		stage.on("add", this.onAddBlock.bind(this));
		stage.on("invalidate", this.invalidate.bind(this));
		stage.on("dragstart", this.ready.bind(this));
		stage.on("drag", this.drag.bind(this));
		stage.on("dragend", this.onDragEnd.bind(this));
	};
	BlockManager.prototype.set = function () {
		this.context.shadowBlur = 5;
		this.context.shadowColor = "black";
		this.context.shadowOffsetX = 1;
		this.context.shadowOffsetY = 1;
	};
	BlockManager.prototype.drawBlock = function (block) {console.log(block);
		block.path(this.context);
		
		this.context.stroke();
		
		if(block.image) {
			this.context.drawImage(block.image, block.rect.x - block.rect.w/2, block.rect.y - block.rect.h/2, block.rect.w);
		}
	};
	/*
	 * Event handler
	 */
	BlockManager.prototype.onAddBlock = function (event) {
		this.drawBlock(event.block);
	};
	BlockManager.prototype.ready = function (event) {
		if (event.mode != Stage.MODE_MOVE) {
			return;
		}
		
		this.copy();
	};
	BlockManager.prototype.drag = function (event) {
		if (event.mode != Stage.MODE_MOVE) {
			return;
		}
		
		this.clear();
		
		this.load(event.x, event.y);
	};
	BlockManager.prototype.onDragEnd = function (event) {
		if (event.mode != Stage.MODE_MOVE) {
			return;
		}
		
		this.invalidate();
	};
	/*
	 * Method
	 */
	
	window.BlockManager = BlockManager;

}) (window);
