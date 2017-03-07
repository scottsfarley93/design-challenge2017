//application setup
var express = require("express");
var request = require('request');
var fs = require('fs');
var turf = require('turf');
var cors = require('cors')
var app = express();
const port = 3000;
const isochronHost = "http://matrix.mapzen.com/isochrone?"
const mapzen_key = "mapzen-RsgxFds";
const allowedCosting = ["auto", "bicycle", "pedestrian", "multimodal"];

var id = "walk_time_5mins";

app.use(cors());


//data sources
var querySources = [ //points
  {name: 'busStops', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/72f376c15a0a4dbe873b82042de41a6e_3.geojson"},
  {name: 'fireStations', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/dd8af3de557f483197a9b2b228443d0b_1.geojson"},
  {name: 'streetTrees', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/dd8af3de557f483197a9b2b228443d0b_0.geojson"},
  {name: 'bikeShare', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/72f376c15a0a4dbe873b82042de41a6e_9.geojson"},
  {name: 'policeStations', url:"http://data-cityofmadison.opendata.arcgis.com/datasets/dd8af3de557f483197a9b2b228443d0b_2.geojson"},
  {name: 'libraries', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/dd8af3de557f483197a9b2b228443d0b_3.geojson"},
  {name: 'transferStations', url: "http://data-cityofmadison.opendata.arcgis.com/datasets/72f376c15a0a4dbe873b82042de41a6e_4.geojson"}
]

var parcelSource = "./data/centroids_all.geojson";


//actually get the data
var parcelLayer;
var queryLayers = {};

//utility function that requests the url and associates the resulting geojson with the layers object
function loadLayer(name, url){
  request(url, function(error, response, data){
    queryLayers[name] = JSON.parse(data)
    console.log(name + ":" + queryLayers[name].features.length);
  })
}

//initialization happens on server boot
function init(){
  fs.readFile(parcelSource, function(error, data){
    if (error) throw error;
    parcelLayer = JSON.parse(data);
    console.log("Got parcels" + ":" + parcelLayer.features.length);
  })

  for (var i=0; i < querySources.length; i++){
    var source = querySources[i];
    var sourceName = source.name;
    var sourceURL = source.url;
    loadLayer(sourceName, sourceURL)
  }
}

init();


function isochroneOptions(lat, lng, time, cost){
  if (allowedCosting.indexOf(cost) < 0){
    throw "Unknown costing surface"
  }
  return {
    locations: [{
      lat:lat,
      lon: lng
    }],
    costing: cost,
    contours: [
      {
       time: time
     }
    ]
  }
}

//request the isochrone from  mapzen
function getIsoChronFromPos(lat, lng, time, cost, callback, res, layerList){
  requestOptions = new isochroneOptions(lat, lng, time, cost);

  requestOptions = JSON.stringify(requestOptions);
  var requestEndpoint = isochronHost + "json=" + requestOptions + "&id=walk_time_5mins&api_key=" + mapzen_key + "&polygons=true"
  request(requestEndpoint, function(error, response, data){
    if (error) throw error;
    callback(data, layerList, res)
  })
}


function onIsoChronReceipt(isoGeojson, layerList, res){
  isoGeojson = JSON.parse(isoGeojson);
  var pointsWithin = {}
  pointsWithin.parcels = calcWithinIsoLines(isoGeojson, parcelLayer);
  stats = getParcelStats(pointsWithin.parcels);
  for (var i =0; i < layerList.length; i++){
    var layerName = layerList[i];
    var thesePoints = queryLayers[layerName];
    pointsWithin[layerName] = calcWithinIsoLines(isoGeojson, thesePoints)
    stats[layerName] = pointsWithin[layerName].features.length;
  }
  isoGeojson.features[0].properties = stats
  res.json(isoGeojson)
}

function calcWithinIsoLines(isoGeojson, points){
  var pointsWithin = turf.within(points, isoGeojson);
  return pointsWithin;
}

function getParcelStats(parcelsWithin){
  stats = {
    vacant: 0,
    singleFamily: 0,
    residential: 0,
    total: 0,
    agricultural: 0,
    commercial: 0,
    industrial: 0,
    meanTotalTax: 0,
    meanParcelSize: 0
  }
  for (var i = 0; i < parcelsWithin.features.length; i++){
    point = parcelsWithin.features[i];
    props = point.properties
    stats.total += 1;
    c = props.PropertyClass;
    u = props.PropertyUse;

    if (c == "Residential"){
      stats.residential += 1;
    }
    if (c == "Commercial"){
      stats.commercial += 1
    }
    if (c == "Industrial"){
      stats.industrial += 1
    }
    if (c == "Agricultural"){
      stats.agricultural += 1;
    }
    if (u == "Vacant"){
      stats.vacant += 1
    }
    if (u == "Single Family"){
      stats.singleFamily += 1
    }
    stats.meanParcelSize += props.SHAPESTArea;
    stats.meanTotalTax += props.TotalTaxes;
  } //end loop

  stats.meanParcelSize = stats.meanParcelSize / stats.total;
  stats.meanTotalTax = stats.meanTotalTax  / stats.total;
  return stats;
}






app.get("/execute", function(req, res){
  var latitude = req.query.latitude;
  var longitude = req.query.longitude ;
  var time = req.query.time;
  var method = req.query.method;
  var layers = req.query.layers || ['busStops', 'fireStations', 'bikeShare', 'policeStations', 'libraries', 'streetTrees'];

  getIsoChronFromPos(latitude, longitude, time, method, onIsoChronReceipt, res, layers)


})


function isValid(num){
  if ((num === undefined) || (num === null) || (num === '') || (+num === NaN)){
    return false
  }
  return true
}






app.listen(port, function () {
  console.log('Running on port ' + port);
})
