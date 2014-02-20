
var ui = {

};

ui.generateDetailHtml = function(crime) {
	var html = [];
	var m = moment(crime.tstamp);
	html.push("<div class='popupDetail'>")
	html.push(" CASE NO: " + crime.caseno);
	html.push(" <br/>");
	html.push("	<strong>" + crime.description + "</strong>");
	html.push(" <br/>");
	html.push("	<em>" + m.format("MM/DD/YYYY, h:mm a")  + "</em>");
	html.push(" <br/>");
	html.push(" Type: " + app.crimeTypes[crime.typecode])
	html.push("</div>");
	return html.join('\n');
};