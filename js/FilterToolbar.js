function FilterToolbar() {
	var self = this;

	$('#header').append("<div id='filterTools'></div>");
	
	this.container = $('#filterTools');

	$("<span class='filterlabel'><strong>Mode:</strong></span>").appendTo(this.container);
	var markerMode = $("<input id='cbMarkerMode' name='mode' type='radio' /><span class='filterlabel'>Markers</span>");
	markerMode.appendTo(this.container);
	markerMode.click(function() {
		self.markerModeOn();
	});
	var heatmapMode = $("<input id='cbHeatmapMode' name='mode' type='radio' /><span class='filterlabel'>Heatmap</span>");
	heatmapMode.appendTo(this.container);
	heatmapMode.click(function(evt) {
		self.heatmapModeOn();
	});

	if (app.mode.markers) {
		markerMode.attr('checked', 'checked');
	}
	else if (app.mode.heatmap) {
		markerMode.attr('checked', 'checked')
	}

	$("<span class='filterlabel' style='margin-left:25px'><strong>Type:</strong></span>").appendTo(this.container);
	var typeSelect = $("<select id='selType' style='margin-left:5px'/>");
	$("<option />", {value: -1, text: 'All' }).appendTo(typeSelect);
	for(var i = 0; i < app.crimeTypes.length; i++) {
	    $("<option />", {value: i, text: app.crimeTypes[i]}).appendTo(typeSelect);
	}
	typeSelect.appendTo(this.container);

	$("<span class='filterlabel' style='margin-left:10px'><strong>Time:</strong></span>").appendTo(this.container);
	var timeSelect = $("<select id='selTime' style='margin-left:5px'/>");
	$("<option />", {value: -1, text: 'Any' }).appendTo(timeSelect);
	$("<option />", {value: 0, text: 'Last 24 hours' }).appendTo(timeSelect);
	$("<option />", {value: 1, text: 'Last 7 days' }).appendTo(timeSelect);
	$("<option />", {value: 2, text: 'Last 30 days' }).appendTo(timeSelect);
	timeSelect.appendTo(this.container);

	$("<span class='filterlabel' style='margin-left:10px'><strong>Keywords:</strong></span>").appendTo(this.container);
	var keywords = $("<input id='txtSearchBox' style='margin-left:5px' />"); //.autocomplete({ source: [] });
	keywords.appendTo(this.container);

	var searchBtn = $("<button style='margin-left:5px' id='btnSearch'>Search</button>");
	searchBtn.appendTo(this.container);
	searchBtn.button({
      icons: {
        primary: "ui-icon-search"
      },
      text: true
    });
	searchBtn.click(function(){
		app.search(self.getSearchParams());
	});

    /*this.container.append("<div id='btnFlag' class='ui-button ui-state-default ui-corner-all ui-widget' style='padding:6px; margin-left: 35px'><span class='ui-button-icon-primary ui-icon ui-icon-flag'></span></div>");
    $("#btnFlag").click(function() {
    	if (app.toggleDistanceSearch) {
    		$(this).toggleClass('ui-state-highlight');
    		app.toggleDistanceSearch = false;
    	}
    	else {
    		$(this).toggleClass('ui-state-highlight');
    		app.toggleDistanceSearch = true;
    	}
    });
    
    var distSelect = $("<select id='selDistance' />");
    for(var c = 1; c <= 10; c++) {
    	$("<option />", {value: c, text: c}).appendTo(distSelect);
    }
    distSelect.appendTo(this.container);
    this.container.append("<span class='filterlabel'>miles</span>");*/

	this.controls = {
		//flagButton: $("#btnFlag"),
		
		markerMode: markerMode,
		heatmapMode: heatmapMode,
		typeSelection: typeSelect,
		timeSelection: timeSelect,
		keywordBox: keywords,
		searchButton: searchBtn
	};
};

FilterToolbar.prototype.toggleDistanceSearch = function() {
	this.controls.flagButton.click();
};

FilterToolbar.prototype.markerModeOn = function() {
	app.map.removeLayer(app.heatmapLayer);
	app.map.addLayer(app.markerLayer);
	app.mode.markers = true;
	app.mode.heatmap = false;
}

FilterToolbar.prototype.heatmapModeOn = function() {
	app.map.removeLayer(app.markerLayer);
	app.map.addLayer(app.heatmapLayer);
	app.mode.markers = false;
	app.mode.heatmap = true;
};

FilterToolbar.prototype.getSearchParams = function() {
	var params = {};
	params.keywords = this.controls.keywordBox.val().split(/\b\s+/);
	params.time = this.controls.timeSelection.val();
	params.type = this.controls.typeSelection.val();
	params.points = [];
	params.distance = -1;
	params.area = -1;
	return params;
}