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

// Define color range
var color = d3.scaleQuantize()
			// .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
            .range(["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]);

d3.csv("../data/consumption-per-smoker-per-day.csv").then((data) => {
    // Set color domain
    // color.domain([
    //     d3.min(data, (d) =>  {return d.value}),
    //     d3.max(data, (d) =>  {return d.value})
    // ]);

    // //Load in GeoJSON data
    // d3.json("scripts/worldMap.json").then(function (json) {

    //     var countryData = {};
        
    //     data.forEach(d => {
    //         var year = +d.Year;
    //         var code = d.Code;
    //         var value = +d.Value;

    //         if (!countryData[code]) {
    //             countryData[code] = {};
    //         }
    //         countryData[code][year] = value;
    //     });

        // //Merge csv data and GeoJSON
        // //Loop through each value
        // for (var i = 0; i < data.length; i++) {

        //     //Grab the country code from csv
        //     if (data[i].Year == "2000")
        //         var csvCode = data[i].Code;

        //     var csvDataArray = [];
            
        //     //Grab csv data value, convert from string to float
        //     var csvValue = parseFloat(data[i].Value);

        //     //Find the corresponding country code in GeoJSON
        //     for (var j = 0; j < json.features.length; j++){
                
        //         var jsonCode = json.features[j].properties.iso_a3;
        //         // console.log(jsonCode);
        //         if (csvCode == jsonCode){
        //             console.log(true);
        //             json.features[j].properties.value = csvValue;

        //             break;
        //         }
        //     }
        // }

        //Bind data and create one path per GeoJSON feature
        // mapSvg.selectAll("path")
        //     .data(json.features)
        //     .enter()
        //     .append("path")
        //     .attr("d", path)
        //     .style("fill", (d) => {
        //         var value = d.properties.value;

        //         if (value){
        //             return color(value);
        //         }
        //         else {
        //             return "#ccc";
        //         }
        //     });
        var countryData = {};
        data.forEach(d => {
            var year = +d.Year; // Convert Year to number
            var code = d.Code; // Country code remains a string
            var value = +d.Value; // Convert Value to number
    
            if (!countryData[code]) {
                countryData[code] = {};
            }
            countryData[code][year] = value;
        });
    
        // Load in GeoJSON data
        d3.json("scripts/worldMap.json").then(function (json) {
            // Merge csv data and GeoJSON
            json.features.forEach(feature => {
                var code = feature.properties.iso_a3;
                if (countryData[code]) {
                    feature.properties.values = countryData[code];
                } else {
                    feature.properties.values = {}; // If no data, set an empty object
                }
            });
    
            // Bind data and create one path per GeoJSON feature
            mapSvg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
    
            // // Create a dropdown to select year
            // var years = d3.range(1980, 2013);
            // var dropdown = d3.select(".vis2")
            //     .append("select")
            //     .attr("class", "year-dropdown")
            //     .on("change", updateMap);
    
            // dropdown.selectAll("option")
            //     .data(years)
            //     .enter()
            //     .append("option")
            //     .attr("value", d => d)
            //     .text(d => d);
            // Slider for year selection
            var slider = d3.select("#year-slider");
            var selectedYearLabel = d3.select("#selected-year");

            slider.on("input", function() {
                var selectedYear = slider.node().value;
                selectedYearLabel.text(selectedYear);
                updateMap(selectedYear);
            });
    
            // Initial map display
            updateMap(slider.node().value);

    
            function updateMap(selectedYear) {
                var values = json.features.map(d => d.properties.values[selectedYear]);
                var minValue = d3.min(values);
                var maxValue = d3.max(values);
            
                color.domain([minValue, maxValue]);
            
                // Update map colors based on the selected year
                mapSvg.selectAll("path")
                    .attr("fill", d => {
                        var value = d.properties.values[selectedYear];
                        return value ? color(value) : "#ccc";
                    });
            }
            // // Update map colors based on the selected year
            // mapSvg.selectAll("path")
            //     .attr("fill", d => {
            //         var value = d.properties.values[selectedYear];
            //         return value ? color(value) : "#ccc";
            //     });
        
        });
})
