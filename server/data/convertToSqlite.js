var fs = require('fs'),
    xml2js = require('xml2js');
var sqlite3 = require('spatialite');
var db;

function convertToSqlite() {
	createDb();
}

function createDb() {
	var dbPath = './crime.sqlite';
	db = new sqlite3.Database(dbPath);



	fillDB();
}

function fillDB() {
	db.spatialite( function() {
		db.serialize( function() {
			db.run("DROP TABLE IF EXISTS crimes;")
			db.run("DROP TABLE IF EXISTS crimeType;")

			db.run("CREATE TABLE crimes ( name TEXT, description TEXT, time DATETIME, type INTEGER, link TEXT, lat DOUBLE, lon DOUBLE, geom BLOB);");
			db.run("CREATE TABLE crimeType ( code INTEGER, label TEXT );");

			var parser = new xml2js.Parser();
			fs.readFile('./sfCrimeData10k.kml', function(err, data) {
			    parser.parseString(data, function (err, result) {
			        var placeMarks = result.kml.Document[0].Placemark;
			        //console.log(placeMarks.length);

			        var typeArray = [];
			        db.parallelize( function() {
				        for(var i = 0; i < placeMarks.length; i++) {
				        	var pm = placeMarks[i];
				        	/*if (i == 0) {
				        		console.log(pm.name[0].trim());
				        		console.log(pm.description[0].trim());
				        		console.log(pm['gx:TimeStamp'][0].when[0]);
				        		console.log(pm.ExtendedData[0].Data[0]._);
				        		console.log(pm.ExtendedData[0].Data[1]._);
				        		console.log(pm.Point[0].coordinates[0]);
				        	}*/

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

				        	db.run("INSERT INTO crimes VALUES ('" + escapeString(name) + "', '" 
				        		+ escapeString(description) + "', '" + date.getTime() + "', '" + typeCode + "', '"
				        		+ escapeString(link) + "', " + lat + ", " + lon + ", "
				        		+ "GeomFromText('POINT(" + lat + " " + lon + ")')" + ");");
				        }

				        for (var i = 0; i < typeArray.length; i++) {
				        	db.run("INSERT INTO crimeType VALUES (" + i + ", '" + escapeString(typeArray[i]) + "');");
				        }
			        })
			    });
			});

			db.run("CREATE INDEX crime_type ON crimes (type);");
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

convertToSqlite();