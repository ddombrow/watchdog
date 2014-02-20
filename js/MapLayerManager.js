function MapLayerManager() {

};

MapLayerManager.prototype.createMarkers = function() {
	var result = app.lastSearchResult;
	var markers = L.markerClusterGroup();
		
	for (var i = 0; i < result.features.length; i++) {
		var poi = result.features[i];
		var title = poi.description;
		var marker = L.marker(new L.LatLng(poi.geometry.coordinates[1], poi.geometry.coordinates[0]), { title: title });
		marker.bindPopup(ui.generateDetailHtml(poi));
		markers.addLayer(marker);
	}

	app.markerLayer = markers;

	if (app.mode.markers) {
		app.map.addLayer(markers);
	}
};

MapLayerManager.prototype.createHeatmap = function() {
	var result = app.lastSearchResult;
	var data = [];
	for (var i = 0; i < result.features.length; i++) {		
		data.push({lat: result.features[i].geometry.coordinates[1], lon: result.features[i].geometry.coordinates[0], value: 1});
	}

	var heatmapLayer = L.TileLayer.heatMap({
        radius: 20,
        opacity: 0.8,
        gradient: {
            0.45: "rgb(0,0,255)",
            0.55: "rgb(0,255,255)",
            0.65: "rgb(0,255,0)",
            0.95: "yellow",
            1.0: "rgb(255,0,0)"
        },
        zIndex:99
    });
	
    heatmapLayer.addData(data);

    app.heatmapLayer = heatmapLayer;

    if (app.mode.heatmap) {
    	app.map.addLayer(heatmapLayer);
    }
};

MapLayerManager.prototype.createRangeCircle = function(pt, dst) {
	var lat = pt[0].lat;
	var lon = pt[0].lon;
	//console.dir('pt: ' + pt);
	//console.log('dst: ' + dst);

	app.rangeLayer = L.circle([lat, lon], dst*1609.34);

	app.map.addLayer(app.rangeLayer);
};

MapLayerManager.prototype.clearAll = function() {
	app.map.removeLayer(app.markerLayer);
	app.map.removeLayer(app.heatmapLayer);

	delete app.heatmapLayer;
	delete app.markerLayer;

	if (app.rangeLayer) {
		app.map.removeLayer(app.rangeLayer);
		delete app.rangeLayer;
	}
};