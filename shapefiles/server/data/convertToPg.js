var fs = require('fs'),
    xml2js = require('xml2js');
var pg = require('pg');

var conString = "postgres://ddombrow:chretien@localhost/watchdog";
var client = new pg.Client(conString);

var convertToPg = function() {
	client.connect( function(err) {
		if(err) {
			return console.error('could not connect to postgres', err);
		}

		var crimesSql = [];
		var crimeTypesSql = [];

		var parser = new xml2js.Parser();
		fs.readFile('./sfCrimeData10k.kml', function(err, data) {
		    parser.parseString(data, function (err, result) {
		        var placeMarks = result.kml.Document[0].Placemark;
		        //console.log(placeMarks.length);

		        var typeArray = [];

		        for(var i = 0; i < placeMarks.length; i++) {
		        	var pm = placeMarks[i];

		        	var name = pm.name[0].trim();
		        	var description = pm.description[0].trim();
		        	var timeStamp = pm['gx:TimeStamp'][0].when[0];
		        	var type = pm.ExtendedData[0].Data[0]._.trim();
		        	var link = pm.ExtendedData[0].Data[1]._.trim();
		        	var coords = pm.Point[0].coordinates[0].trim();
		        	
		        	var date = new Date(timeStamp); // put the timestamp into a js date object
		        	
		        	var typeCode = contains(typeArray, type);
		        	if (typeCode == -1) {
		        		typeArray.push(type);
		        		typeCode = typeArray.length-1;
		        	}
		        	
		        	var lat = parseFloat(coords.split(',')[0]);
		        	var lon = parseFloat(coords.split(',')[1]);

		        	var caseNo = parseInt(name.replace('Case ', ''), 10);

		        	crimesSql.push("INSERT INTO crimes (caseNo, typeCode, description, link, tstamp, lat, lon, geom, descVec)" 
		        		+ "VALUES (" + caseNo + ", " + typeCode + ", '" + escapeString(description) + "', '" +  escapeString(link) + "', '" 
		        		+ date.toISOString() + "', " + lat + ", " + lon + ", " + "ST_GeomFromText('POINT(" + lat + " " + lon + ")', 4326)" + ","
		        		+ "to_tsvector('" + escapeString(description) + "')" + ");");
		        }

		        for (var i = 0; i < typeArray.length; i++) {
		        	crimeTypesSql.push("INSERT INTO crimeType VALUES (" + i + ", '" + escapeString(typeArray[i]) + "');");
		        }

		        console.log('crimeTypesSql - \n' + crimeTypesSql.join('\n'));

				var typeInsertQuery = client.query(crimeTypesSql.join('\n'), function(err, result) {
				    if (err) {
				    	console.error(err);
				    }

				    var crimeInsertQuery = client.query(crimesSql.join('\n'), function(err, result) {
				    	if (err) {
				    		console.error(err);
				    	}

				    	client.end();
				    });
			  	});
	        });
		});
	});
};

var contains = function(arr, val) {
	for(var i = 0; i < arr.length; i++) {
		if (arr[i] == val) {
			return i;
		}
	}
	return -1;
};

var escapeString = function (val) {
  val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function (s) {
    switch (s) {
      case "\0":
        return "\\0";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\b":
        return "\\b";
      case "\t":
        return "\\t";
      case "\x1a":
        return "\\Z";
      default:
        return "\\" + s;
    }
  });

  return val;
};

convertToPg();