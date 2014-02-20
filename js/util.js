var util = {};

util.buildSearchQueryString = function(params) {
	var q = [];
	q.push("?");
	q.push("t=");
	q.push(new Date().getTime());
	
	if (params.keywords) {
		q.push("&keywords=");
		for (var i = 0; i < params.keywords.length; i++) {
			q.push(params.keywords[i]);
			q.push(",");
		}
		q.pop();
	}

	if (params.time > -1) {
		q.push("&startTime=")

		//**** SUPER HACK INCOMING
		// setting the clock back to make this feature demo nicer
		//***
		var t = moment('2012-10-11 08:00:00-04');
		//*** END SUPER HACK

		//var t = moment();
		
		var timeAgoOffset = [1, 7, 30];


		t.subtract('days', timeAgoOffset[params.time]);
		q.push(t.toISOString());
	}

	if (params.type > -1) {
		q.push("&type=");
		q.push(params.type);
	}

	if (params.points.length > 0 && params.distance > 0) {
		var pt = params.points[0]; //TODO, support multiple points
		q.push("&points=");
		q.push(pt.lat + ' ' + pt.lon);
		q.push("&distance=");
		q.push(params.distance);
	}

	return q.join('');
};