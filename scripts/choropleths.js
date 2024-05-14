var w = 800;
var h = 500;

//Set up projection
var projection = d3.geoMercator()
    .center([140, -36.5])
    .translate([300, 250])
    .scale(90);

//Define path generator
var path = d3.geoPath()
    .projection(projection);

//Create SVG element
var mapSvg = d3.select(".vis2")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "grey");

//Load in GeoJSON data
d3.json("scripts/worldMap.json").then(function (json) {

    //Bind data and create one path per GeoJSON feature
    mapSvg.selectAll("path")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path);

});