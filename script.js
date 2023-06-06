var language = 'no';
var lang = langNO;

setLanguage("no");

var formID = "1FAIpQLSdHEe-PntO7HLp6-d1j8rmmjqyWxZYryNDTels3lfVU0jbuRQ"
var formpathID = "2020612733"

var points = [];
var markers = [];
var currentRoute = [];
var routes = [];
var segmentPolyline = {}
var currentPolyline = [];
var polylines = [];

var purposes = []
var frequencies = []
var seasons = []

var originIcon = L.icon({
	iconUrl: 'leaflet/images/marker-icon-lime.png',
	size: [25,41],
	iconAnchor: [13,41],
	shadowUrl : 'leaflet/images/marker-shadow.png'
});

var destIcon = L.icon({
	iconUrl: 'leaflet/images/marker-icon-red.png',
	size: [25,41],
	iconAnchor: [13,41],
	shadowUrl : 'leaflet/images/marker-shadow.png'
});

var midIcon = L.icon({
	iconUrl: 'leaflet/images/marker-icon-mid.png',
	size: [25,41],
	iconAnchor: [13,41],
	shadowUrl : 'leaflet/images/marker-shadow.png'
});

const map = L.map('map').setView([63.42, 10.43], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Service © <a href="https://openrouteservice.org/">openrouteservice.org</a> | Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	maxZoom: 19
}).addTo(map);


// Change the language of the page
function setLanguage(lg) {
	if (lg == 'en') {
		lang = langEN;
		language = 'en';
	}
	if (lg == 'no') {
		lang = langNO;
		language = 'no';
	}
	$("#title_question").text(lang.title_question);
	$("#title_instructions").text(lang.title_instructions);
	$("#removeLastPoint").text(lang.button_remove);
	$("#openPopup").text(lang.button_end);
	$("#sendRoute").text(lang.button_send);
	$("#sendRoute2").text(lang.button_send);
	$("#user_form_title").text(lang.about_you);
	$("#gender_question").text(lang.gender_question);
	$("#male_label").text(lang.male);
	$("#female_label").text(lang.female);
	$("#other_gender_label").text(lang.other);
	$("#pnts_label").text(lang.pnts);
	$("#age_question").text(lang.age_question);
	$("label[for='file_input']").text(lang.file_input);
}


// Add new markers to the map and open google form
function onMapClick(e) {
	lat = e.latlng.lat;
	lng = e.latlng.lng;
	
	if (markers.length == 0) {
		icon = originIcon;
	}
	if (markers.length > 0) {
		icon = destIcon;
	}
	if (markers.length > 1) {
		console.log("kokok");
		markers[markers.length - 1].setIcon(midIcon);
	}
	
	
	marker = L.marker(e.latlng, {icon: icon}).addTo(map);
	markers.push(marker);
	points.push([lng,lat]);
	document.getElementById("removeLastPoint").disabled = false;
	if (points.length == 1) {
		document.getElementById("sendRoute").disabled = true;
		document.getElementById("sendRoute2").disabled = true;
	}
	if (points.length > 1) {
		document.getElementById("openPopup").disabled = false;
		CalculateRoute(points.slice(-2));
	}
}


function RequestRoute(callback, coords) { //coords format : [[long1,lat1],[long2,lat2],... ]
	var request = new XMLHttpRequest();

	request.open('GET', 'https://api.openrouteservice.org/v2/directions/foot-walking?api_key=5b3ce3597851110001cf624856267c988af04c6b9f9359cc64ff5171&start=' + coords[0][0] + ',' + coords[0][1] + '&end=' + coords[1][0] + ',' + coords[1][1]);

	request.setRequestHeader('Accept', 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8');

	request.onreadystatechange = function () {
	  if (this.readyState === 4) {
		var route = JSON.parse(this.responseText);
		callback(route.features[0].geometry.coordinates);
	  }
	};

	request.send();
}


function DisplayRoute(route) {
	for (p of route) {
		p.reverse(); //ORS use lng,lat but leaflet use lat,lng
	}
	segmentPolyline = new L.Polyline(route, {
		color : '#0000FF',
	});
	segmentPolyline.addTo(map);
	currentPolyline.push(segmentPolyline);
}
	
	
function CalculateRoute(coords) {
  RequestRoute(function(route) {
    currentRoute = route;
	DisplayRoute(currentRoute);
  }, coords);
}


function RemoveLastPoint() {
	points.pop();
	map.removeLayer(markers.pop());	
	if (currentPolyline.length > 0) {
		map.removeLayer(currentPolyline.pop());
	}
	if (markers.length == 0) {
		document.getElementById("removeLastPoint").disabled = true;
		if (routes.length > 0) {
			document.getElementById("sendRoute").disabled = false;
			document.getElementById("sendRoute2").disabled = false;
		}
	}
	if (markers.length == 1) {
		document.getElementById("sendRoute").disabled = true;
		document.getElementById("sendRoute2").disabled = true;
		document.getElementById("openPopup").disabled = true;
	}
	if (markers.length > 1) {
		markers[markers.length - 1].setIcon(destIcon);
		if (markers.length > 2) {
			markers[markers.length - 2].setIcon(midIcon);
		}
	}
};

function LoadGPXFile() {
	var files = document.getElementById("file_input").files;
	var file = files[0];
	if (file.name.slice(-3) != 'gpx') {
		document.getElementById('warning').innerHTML = lang.warning_GPX;
		return;
	}
	document.getElementById('warning').innerHTML = ""; 
	
	var reader = new FileReader();
	reader.onload = function(event) {
		var content = event.target.result;	
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(content, "text/xml");
		const trkptElements = xmlDoc.getElementsByTagName("trkpt");
		const route = [];
		
		for (e of trkptElements) {
			const lat = e.getAttribute("lat");
			const lon = e.getAttribute("lon");
			route.push([lat,lon]);
		}
		segmentPolyline = new L.Polyline(route, {
			color : '#0000FF',
		});
		segmentPolyline.addTo(map);
		currentPolyline.push(segmentPolyline);
		
		marker = L.marker(route[0], {icon: originIcon}).addTo(map);
		markers.push(marker);
		marker = L.marker(route.slice(-1)[0], {icon: destIcon}).addTo(map);
		markers.push(marker);
		
		currentRoute = route;
		
		OpenPopup();
	}
	reader.readAsText(file);
}



function OpenPopup() {
	if (language == "en") {
		var popup = L.popup({content: `
			<div class="form-group">
				<label for="purpose">What is the purpose of this trip ?<br></label>
				<label class="form-radio">
				  <input type="radio" id="work" name="purpose" value="work" checked="checked" onclick="UpdateInput('otherPurposeInput',true)"></input>
				  Work<br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="shop" name="purpose" value="shop" onclick="UpdateInput('otherPurposeInput',true)"></input>
				  Shop<br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="other" name="purpose" value="other" onclick="UpdateInput('otherPurposeInput',false)"></input>
				  Other : <input type="text" name="purpose" placeholder="purpose of the trip" id="otherPurposeInput" disabled="false"/> <br><br>
				</label>		
			</div>
			
			<div class="form-group">
				<label for="purpose">How many times a week do you cycle this route ?<br></label>
				<label class="form-radio">
				  <input type="radio" id="frequency1" name="frequency" value="1-2 times a week" checked="checked"></input>
				  1-2 times a week <br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="frequency2" name="frequency" value="3-4 times a week"></input>
				  3-4 times a week <br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="frequency3" name="frequency" value=">4 times a week"></input>
				  4+ times a week <br><br>
				</label>		
			</div>
			
			<div class="form-group">
				<label for="purpose">During which time of the year do you cycle this route ?<br></label>
				<label class="form-radio">
				  <input type="radio" id="season1" name="season" value="summer only" checked="checked"></input>
				  Summer only <br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="season2" name="season" value="winter only"></input>
				  Winter only <br>
				</label>
				<label class="form-radio">
				  <input type="radio" id="season3" name="season" value="all the year"></input>
				  All the year <br><br>
				</label>		
			</div>
			
			<em class="text-muted">Click on the button to validate this route.</em>
		<hr />
		<button type="button" class="submitButton" onclick="EndRoute();">Validate this route</button>
	  `,
	closeButton: true});
  }
	if (language == "no") {
		// var popup = L.popup({content: document.getElementById("formdivNO").innerHTML});
	};
	markers.slice(-1)[0].bindPopup(popup).openPopup();
}

function EndRoute() {
	map.removeLayer(markers.pop()); //Remove the last marker (there is one more marker than polylines)
	for (let i = 0; i < currentPolyline.length; i++) {
		currentPolyline[i].setStyle({color: 'black'});
		map.removeLayer(markers[i]);
	}
	
	var purpose = document.querySelector('input[name="purpose"]:checked').value;	
	if (purpose == "other") {
		purpose = purpose + ": " + document.getElementById("otherPurposeInput").value;
	};
	purposes.push(purpose);
	
	var frequency = document.querySelector('input[name="frequency"]:checked').value;
	frequencies.push(frequency);
	
	var season = document.querySelector('input[name="season"]:checked').value;
	seasons.push(season);
	
	document.getElementById("openPopup").disabled = true;
	document.getElementById("removeLastPoint").disabled = true;
	document.getElementById("sendRoute").disabled = false;
	document.getElementById("sendRoute2").disabled = false;
	routes.push(currentRoute);
	polylines.push(currentPolyline);
	currentRoute = [];
	currentPolyline = [];
	points = [];
	markers = [];
};


function SendRoute() {
	if (document.querySelectorAll('input[name="gender"]:checked').length == 0 || document.querySelectorAll('input[name="age"]:checked').length == 0) {
		window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
		
		return;
	};
	
	var gender = document.querySelector('input[name="gender"]:checked').value;
	if (gender == "other") {
		console.log("ouioui");
		gender = "other:" + document.getElementById("otherGenderInput").value;
	}
	var age = document.querySelector('input[name="age"]:checked').value;
	
	var path = gender + ";" + age + ";";
	for (let i = 0; i < routes.length; i++) {
		path = path + polyline.encode(routes[i]) + ";" + purposes[i] + ";" + frequencies[i] + ";" + seasons[i] + ";";
	};
	
	var link = "https://docs.google.com/forms/d/e/" + formID + "/formResponse?usp=pp_url&entry." + formpathID + '=' + path + "&submit=Submit";
	window.open(link);
	
	document.getElementById("sendRoute").disabled = true;
	document.getElementById("sendRoute2").disabled = true;
	map.removeEventListener('click', onMapClick);
	map.on('click', function () {
	window.scrollTo({ left: 0, top: 0, behavior: "smooth" });
	document.getElementById("warning").innerHTML = lang.warning_refresh;
	});
};


function UpdateInput(id,disabled) {
	document.getElementById(id).disabled = disabled;
	if (disabled) {
		document.getElementById(id).value = "";
	};
};


map.on('click', onMapClick);

document.getElementById("file_input").addEventListener("change", LoadGPXFile);


