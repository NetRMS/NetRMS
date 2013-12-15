(function (window, undefined) {

	"use strict";

	//var _ = extend("util");
	
	/*
	 * Area Manager
	 */
	
	function AreaManager (stage) {
		this.initialize(stage);
	}
	AreaManager.prototype = new StageManager();
	AreaManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this,stage);
		
		stage.on("dragstart", this.reDraw.bind(this));
		stage.on("drag", this.reDraw.bind(this));
		stage.on("dragend", this.reDraw.bind(this));
	};
	AreaManager.prototype.set = function () {
		this.context.strokeStyle = "rgb(105, 105, 105)";
		this.context.lineWidth = 1;
		this.context.fillStyle = "rgba(105, 105, 105, 0.2)";
	};
	AreaManager.prototype.reDraw = function (event) {
		if (event.block || (stage.mode & Stage.MODE_MOVE)) {
			return;
		}
		
		this.clear();
		
		if(event.type == "drag") {
			var rect = event.rect;
	
			this.context.beginPath();
			this.context.rect(rect.x, rect.y, rect.w, rect.h);
			this.context.closePath();
			
			this.context.stroke();
			this.context.fill();
		}
		else if (event.type == "dragstart") {
			stage.cursor("crosshair");
		}
		else if (event.type == "dragend") {
			stage.cursor("default");
		}
	};
	
	window.AreaManager = AreaManager;
	 
}) (window);
