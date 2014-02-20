var app = {
	baseUrl: "http://localhost:8081/",
	crimeTypes: {},
	toggleDistanceSearch: false
};

$(document).ready(function() {
	
	app.rightSize();

	var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png';
	var bwStamenUrl = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png';
	var terrainStamenUrl = 'http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg';
	var transportOcmUrl = 'http://{s}.tile3.opencyclemap.org/transport/{z}/{x}/{y}.png';
	var basemap = new L.TileLayer(bwStamenUrl, {maxZoom: 18});
	var basemap2 = L.tileLayer(cloudmadeUrl);
	var basemap3 = L.tileLayer(terrainStamenUrl);
	var basemap4 = L.tileLayer(transportOcmUrl);
	var latlng = new L.LatLng(37.7556, -122.4500);
	var startZoom = 13;

	var controllerOptions = {
		collapsed: false,
	}

	var mapOptions = { 
		center: latlng,
		zoom: startZoom,
		layers: [basemap],
		boxZoom: true
	};
	var map = app.map = new L.Map('map', mapOptions);
	/*map.on('click', function(e) {
		if (app.toggleDistanceSearch) {
			alert(e.latlng);
			app.ui.filterToolbar.toggleDistanceSearch();
		}
	});
	var neighborhoodStyle = {
    	"color": "#ff7800",
    	"weight": 3,
    	"opacity": 0.65
	};
	function onEachNeighborhood(feature, layer) {
        layer.bindPopup(feature.properties.NAME);
	}
	var neighborhoodLayer = L.geoJson(null, { style: neighborhoodStyle, onEachFeature: onEachNeighborhood }).addTo(map);
	neighborhoodLayer.addData(neighborhoodsSF);*/

	//var schoolLayer = L.geoJson(null).addTo(map);
	//schoolLayer.addData(schoolLayer);

    var baseLayers = {
		"Black and White": basemap,
		"Street Maps": basemap2,
		"Terrain": basemap3,
		"Transport Map": basemap4
	};

	var overlays = {
		//"Neighborhoods": neighborhoodLayer
		//"Public Schools": schoolLayer
	};

	var layersControl = new L.Control.Layers(baseLayers, overlays, controllerOptions); 
	map.addControl(layersControl);

	app.mode = {
		markers: true,
		heatmap: false
	}
	app.layerManager = new MapLayerManager();

	app.loadConfig();
	app.loadCrimes();
});

app.setupUI = function() {
	app.ui = ui;
	app.ui.filterToolbar = new FilterToolbar();

	// range search demo setup.  press control shift a for the magic.
	key('ctrl+shift+a', function(){ 
		var alat = 37.77919; //city hall in SF
		var alon = -122.41914;
		var dst = 2;
		app.search({ points:[{ lat: alat, lon: alon}], distance: dst });
		return false;
	});

	// area search demo setup. press control shift d for the magic.
	key('ctrl+shift+d', function(){ 
		console.log("go go distance search experiment");
		return false;
	});
};

app.loadConfig = function() {
	$.ajax({url: app.baseUrl + "config", success: function(result) {
    	app.crimeTypes = result.types;
    	app.setupUI();
  	}});
};

app.loadCrimes = function() {
	$.ajax({url: app.baseUrl + "crimes", success: function(result) {
		//console.dir(result);
		app.lastSearchResult = result;

		if (result && result.features) {
			app.layerManager.createMarkers();
			app.layerManager.createHeatmap();
	    }
	}});
};

app.rightSize = function() {
	var viewportHeight = $(document).height();
	$('#map').height(viewportHeight - 90);
};

app.search = function(params) {
	//console.dir(params);

	$.ajax({url: app.baseUrl + "crimes" + util.buildSearchQueryString(params), success: function(result) {
    	app.lastSearchResult = result;

    	app.layerManager.clearAll();

    	if (result && result.features) {
			app.layerManager.createMarkers();
			app.layerManager.createHeatmap();

			if (params.points.length > 0 && params.distance > -1) {
				app.layerManager.createRangeCircle(params.points, params.distance);
		    }
	    }
  	}});
}

$(window).resize(function() { app.rightSize(); });

