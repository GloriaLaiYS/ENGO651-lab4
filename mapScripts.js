//Create Leaflet Map centered on Calgary
//const map = L.map('map').setView([51.0447, -114.0719], 11);

// Import map layers from Mapbox
var background = L.tileLayer('https://api.mapbox.com/styles/v1/puiling11/clf247wkv000c01mm2i4glqua/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '©️ <a href="https://apps.mapbox.com/feedback/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicHVpbGluZzExIiwiYSI6ImNsZjBkNmllaDAwb3gzcHFqMGdocW5laXUifQ.gd31QkMQxymb2LQ5KR8bOw'
    })
var trafficData = L.tileLayer('https://api.mapbox.com/styles/v1/puiling11/clf0rw91e000d01o5d7gz0mlo/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '©️ <a href="https://apps.mapbox.com/feedback/">Mapbox</a>',
    tileSize: 512,
	  zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoicHVpbGluZzExIiwiYSI6ImNsZjBkNmllaDAwb3gzcHFqMGdocW5laXUifQ.gd31QkMQxymb2LQ5KR8bOw'
	  })

// Set defulat view of the map container
var map = L.map("map", {
  center: [51.050, -114.067],
  zoom: 12,
});

var layerGroup = {
    "Base Map": background,
    "Traffic Incident": trafficData
}
L.control.layers(layerGroup).addTo(map);
background.addTo(map);



//Add OSM Basemap & OpenStreetMap tile layer
//L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
//    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//    maxZoom: 19,
//    tileSize: 512,
//    zoomOffset: -1,
//}).addTo(map);


//Add clustered markers
var markers = L.markerClusterGroup();

//Add spiderifier
var oms = new OverlappingMarkerSpiderfier(map);

var popup = new L.Popup();

oms.addListener('click', function(marker) {
  popup.setContent(marker.desc);
  popup.setLatLng(marker.getLatLng());
  map.openPopup(popup);
});

//get date of today for data validation
const today = new Date();

//Add date picker widgets for picking date range, here I use litepicker
const dateRange = new Litepicker({
    element: document.getElementById('Date'),
    maxDate: today,
    singleMode: false,
  });

//Save Variables(fromDate and endDate) from user
document.querySelector('form').addEventListener('submit', (e) => {
  const formData = new FormData(e.target);

  //Grab sperated variablesas a string'Date' with both dates
  const dates = formData.get('Date');

  //Grab the individual start and end dates from the larger string(startDate)
  var fromDate = dates.substr(0,10);
  var endDate = dates.substr(13);

  var requestURL = "https://data.calgary.ca/resource/c2es-76ed.geojson?" + "$where=issueddate > " + "\'" + fromDate + "\'" + " and issueddate < " + "\'" + endDate + "\'";

  //Use HttpClient to send HTTP requests and receive responses from API
  var data = new HttpClient();
  data.get(requestURL, function(response) {
    createMarkers(response);
  });

  //Make the alert box visible to show alerts
  document.getElementById('count').style.visibility = "visible";

  //Stop the form from submitting to avoid refreshing the page
  e.preventDefault();

});


// Use HttpClient to send HTTP requests and receive responses
// XMLHttpRequest object to request data (GET) 
class HttpClient {
  constructor() {
    this.get = function (aUrl, aCallback) {
      let xhttp = new XMLHttpRequest();

      xhttp.onreadystatechange = function () {
        if (xhttp.readyState == 4 && xhttp.status == 200)
          aCallback(xhttp.responseText);
      };
      xhttp.open("GET", aUrl, true);
      xhttp.send();
    };
  }
}

//Once the response is received, Parse JSON from response and convert them into Leaflet Markers
function createMarkers(json) {
  const data = JSON.parse(json);

  console.log(data);

  //Clear any existing marker data
  //map.clearLayers();
  markers.clearLayers();
  oms.clearMarkers();

  if (data.features.length == 0) {
    document.getElementById('count').innerHTML = "Sorry, there is no data available for these dates.";
  } else {

    for (i in data.features) {

      //If the feature has no geometry, skip it
      if (data.features[i].geometry != null) {
        var coords = data.features[i].geometry.coordinates;

        var date = data.features[i].properties.issueddate || "N/A";
        var wcGroup = data.features[i].properties.workclassgroup || "N/A";
        var contractor = data.features[i].properties.contractorname || "N/A";
        var community = data.features[i].properties.communityname || "N/A";
        var address = data.features[i].properties.originaladdress || "N/A";

        var description = "<table class='table'><tr><th>Issued Date: </th><td>" + date + "</td> </tr> <tr> <th>Community Name: </th>" + "<td>" + community + "</td></tr><tr><th>Work Class Group: </th>" + "<td>" + wcGroup + "</td></tr><tr><th>Contractor: </th> <td>" + contractor + "</td> </tr><tr><th>Original Address: </th>" + "<td>" + address + "</td></tr></table>";

        //Add marker to the spiderifier layer
        var marker = new L.marker([coords[1], coords[0]]);
        marker.desc = description;
        oms.addMarker(marker);

        //Add marker to the cluster layer
        markers.addLayer(marker);


      }
    }

    //Add cluster marker layer to the map
    map.addLayer(markers);
    
    document.getElementById('count').innerHTML =  data.features.length + " features successfully found.";
  }
}