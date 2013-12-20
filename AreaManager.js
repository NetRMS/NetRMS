(function (window, undefined) {

	"use strict";

	var _ = extend("coord");
	
	/*
	 * Area Manager
	 */
	
	function AreaManager (stage) {
		this.initialize(stage);
	}
	
	/*
	 * Extand
	 */
	
	AreaManager.prototype = new StageManager();
	
	/*
	 * Override
	 */
	
	AreaManager.prototype.initialize = function (stage) {
		StageManager.prototype.initialize.call(this);
		
		this.draggable = null;
		this.pos = {};
		
		stage.on("areaselectstart", this.onAreaSelectStart.bind(this));
		stage.on("areaselect", this.onAreaSelect.bind(this));
		stage.on("areaselectend", this.onAreaSelectEnd.bind(this));
		stage.on("reset", this.onReset.bind(this));
	};
	AreaManager.prototype.set = function () {
		this.context.strokeStyle = "rgb(105, 105, 105)";
		this.context.lineWidth = 1;
		this.context.fillStyle = "rgba(105, 105, 105, 0.4)";
		//this.context.fillStyle = "rgba(0, 255, 0, 0.5)";
	};
	
	/*
	 * Event Handler
	 */
	
	AreaManager.prototype.onAreaSelectStart = function (event) {
		this.pos = event.pos;
	};
	AreaManager.prototype.onAreaSelect = function (event) {
		var rect = this.getZoomRect(_.getRect(this.pos, event.pos));
		
		this.clear();
		
		this.context.beginPath();
		this.context.rect(rect.x, rect.y, rect.w, rect.h);
		this.context.closePath();
		
		this.context.stroke();
		this.context.fill();
	};
	AreaManager.prototype.onAreaSelectEnd = function (event) {
		this.clear();
	};
	AreaManager.prototype.onReset = function (event) {
		this.reset(event.width, event.height, event.zoom);
	};
	
	window.AreaManager = AreaManager;
	
}) (window);
