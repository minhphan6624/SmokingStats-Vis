var w = 800;
var h = 500;

//Set up projection
var projection = d3.geoNaturalEarth1()
    .translate([w / 2, h / 2])
    .scale(150);

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