var http = require('http');
var nstatic = require('node-static');
var restify = require('restify');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "watchdog", 
	streams: [
    {
      level: 'error',
      stream: process.stdout,           // log INFO and above to stdout
    },
    {
      level: 'info',
      path: './watchdogs-never-rest.log'  // log ERROR and above to a file
    }
]});
var pg = require('pg');

var conString = "postgres://ddombrow:chretien@localhost/watchdog";
var client = new pg.Client(conString);

function status(req, res, next) {
  log.info("Responding to status query.");
  res.send('Server is running.');
};

function getSingleCrime(req, res, next) {
	log.info("Responding to /crime/id request.");
	try {
		var caseno = req.params.caseno;
		var q = "SELECT id, caseno, typecode, description, link, tstamp, lat, lon FROM crimes WHERE caseno = " + caseno + ";"; 
	}
	catch(e) {
		log.error(e);
	}
};

function getCrimes(req, res, next) {
	log.info("Responding to /crime request.");
	try {
		var queryParams = getQueryParams(req);

		var q = [];
		q.push("SELECT id, caseno, typecode, description, link, tstamp, ST_AsGeoJSON(geom) AS geojson FROM crimes ")
	    q.push("WHERE 1=1 ");
	    if (queryParams.keywords) {
	    	q.push(getKeywordFilter(queryParams.keywords));
	    }
	    if (queryParams.points && queryParams.distance) {
	    	q.push(getDistanceFilter(queryParams.points, queryParams.distance));
	    }
	    if (queryParams.type) {
	    	q.push(getTypeFilter(queryParams.type));
	    }
	    if (queryParams.startTime || queryParams.endTime) {
	    	q.push(getTimeFilter(queryParams.startTime, queryParams.endTime));
	    }
		q.push(" LIMIT 10000;");	
		
		console.log(q.join(''));

		client.query(q.join(''), function(err, result) {
			if (err) {
				log.error(err);
			}
			if (result) {
				var geoJson = postGISQueryToFeatureCollection(result.rows);
				res.writeHead(200, {
				  'Content-Length': Buffer.byteLength(JSON.stringify(geoJson)),
				  'Content-Type': 'application/json'
				});
				res.write(JSON.stringify(geoJson));
				res.end();
			}
			else {
				emptyResponse(res);
			}
		});
	}
	catch(e) {
		log.error(e);
	}
};

function emptyResponse(res) {
	var emptyJson = '{}';
	res.writeHead(200, {
	  'Content-Length': Buffer.byteLength(emptyJson),
	  'Content-Type': 'application/json'
	});
	res.write(emptyJson);
	res.end();
};

function getQueryParams(req) {
	var params = {};
	if (req.params.keywords) {
		params.keywords = req.params.keywords.split(',');
	}
	if (req.params.points && req.params.distance) {
		params.points = [];

		var pts = req.params.points.split(',');
		for (var i=0; i < pts.length; i++) {
			
			var pt = pts[i].split(' ');
			params.points.push(
			{
				lat: pt[0],
				lon: pt[1]
			});
		}

		params.distance = parseInt(req.params.distance, 10) * 1609.34; //conversion from miles to meters for the spatial search
	}
	if (req.params.type) {
		params.type = req.params.type;
	}
	if (req.params.startTime) {
		params.startTime = req.params.startTime;
	}
	if (req.params.endTime) {
		params.endTime = req.params.endTime;
	}
	if (req.params.area) {
		params.area = req.params.area;
	}
	return params;
};

/**
* Builds a SQL clause to filter on type of crime reported
* @param type - type code
*/
function getTypeFilter(type) {
	var filter = [];
	filter.push("AND typeCode = " + type);
	return filter.join('');
};

/**
* Builds a SQL clause to filter on keywords
* @param keywords - array of keywords to filter on using full text search
*/
function getKeywordFilter(keywords) {
	var filter = [];
	//console.log(keywords);
	filter.push("AND descVec @@ to_tsquery('");
    for (var i=0; i < keywords.length; i++) {
    	filter.push(keywords[i].trim());
    	filter.push(" & ");
    }
    filter.pop();
    filter.push("') ");
    return filter.join('');
};

/**
* Builds a SQL clause to filter on distance from a point or points using a spatial function 
* @param pts - an array of lat/lon coordinates
* @param dist - distance in meters to check  
*/
function getDistanceFilter(pts, dist) {
	var filter = [];
	filter.push("AND ST_Distance_Sphere(geom,");
	if (pts.length == 1) {
		filter.push("ST_GeomFromText('POINT(" + pts[0].lon + " " + pts[0].lat + ")',4326)");
	}

	//this section will have to be reworked due to how ST_DWithin actually works
	/*else if (pts.length > 1) {
		filter.push("ST_GeomFromText('LINESTRING(");
		for (var i=0; i < pts.length; i++) {
			filter.push(pts[i].lat + " " + pts[i].lon);
			filter.push(",");
		}
		filter.pop();
		filter.push(")',4326)");
	}*/ 
	
	filter.push(")");
	filter.push(" < " + dist);
	return filter.join('');
	console.log(filter.join(''));
};

/**
* Builds a SQL clause to filter on date and time
* @param start - start time to filter on; if this is provided alone, filter will return anything with a later date
* @param end - end time to filter on; if this is provided alone, filter will return anything with an earlier date
*/
function getTimeFilter(start, end) {
	var filter = [];
	if (start && end) {
		filter.push("AND tstamp BETWEEN ")
		filter.push('\'' + start + '\'');
		filter.push(' AND ')
		filter.push('\'' + end + '\'');
	} else if (start) {
		filter.push('AND tstamp > ');
		filter.push('\'' + start + '\'');
	} else if (end) {
		filter.push('AND tstamp < ');
		filter.push('\'' + end + '\'');
	}
	return filter.join('');
}

/**
* Gets system configuration information to be loaded on application start to the browser
*/
function getConfig(req, res, next) {
	log.info("Responding to /config request.")
	try {
		var configObject = {};

		var q  = "SELECT code, typename FROM crimeType;"
		client.query(q,  function(err, result) {
			if (err) {
				log.error(err);
			}
			if (result) {
				configObject.types = [];
				for (var i=0; i < result.rows.length; i++) {
					var row = result.rows[i];
					configObject.types[row.code] = row.typename;
				}
				res.writeHead(200, {
				  'Content-Length': Buffer.byteLength(JSON.stringify(configObject)),
				  'Content-Type': 'application/json'
				});
				res.write(JSON.stringify(configObject));
				res.end();
			}
			else {
				emptyResponse();
			}
		});
	}
	catch(e) {
		log.error(e);
	}
};

/**
 * Takes an array of associative objects/arrays and outputs a FeatureCollection object.  See <http://www.geojson.org/geojson-spec.html> example 1.1/
 * The Query that fetched the data would need to be similar to: 
 *              SELECT {field_list}, st_asgeojson(...) AS geojson FROM geotable
 * Where the "AS geojson" must be as is. Because the function relies on a "geojson" column.
 * 
 * @param queryResult The query result from the PostGIS database.  Format deduced from <https://gist.github.com/2146017>
 * @returns The equivalent GeoJSON object representation.
 */
function postGISQueryToFeatureCollection(queryResult) {
  // Initalise variables.
  var i = 0,
      length = queryResult.length,
      prop = null,
      geojson = {
        "type": "FeatureCollection",
        "features": []
      };    // Set up the initial GeoJSON object.
  
  for(i = 0; i < length; i++) {  // For each result create a feature
    var feature = {
      "type": "Feature",
      "geometry": JSON.parse(queryResult[i].geojson)
    };
    // finally for each property/extra field, add it to the feature as properties as defined in the GeoJSON spec.
    for(prop in queryResult[i]) {
      if (prop !== "geojson" && queryResult[i].hasOwnProperty(prop)) {
        feature[prop] = queryResult[i][prop];
      }
    }
    // Push the feature into the features array in the geojson object.
    geojson.features.push(feature);
  }
  // return the FeatureCollection geojson object.
  return geojson;
} 


//*** SERVER SETUP AND DEFINITIONS ***//
var fileServer = new nstatic.Server('../');
http.createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                log.error("Error serving " + request.url + " - " + err.message);

                // Respond to the client
                response.writeHead(err.status, err.headers);
                response.end();
            }
        });
    }).resume();
}).listen(8282);
console.log('Static http server listening at localhost:8282');


var apiServer = restify.createServer({ name: 'watchdogs-never-rest', log: log });
apiServer.use(restify.queryParser()); //adds loading params from the querystring after the ?
apiServer.use(restify.CORS());
apiServer.use(restify.fullResponse());

apiServer.get('/status', status);
apiServer.get('/crimes', getCrimes);
apiServer.get('/crimes/:caseno', getSingleCrime);
apiServer.get('/config', getConfig); 

apiServer.listen(8081, function() {
  log.info('%s listening at %s', apiServer.name, apiServer.url);
  console.log('%s listening at %s', apiServer.name, apiServer.url);
  client.connect( function(err) {
	if(err) {
		return console.error('could not connect to postgres', err);
		apiServer.close();
	}
  });
});