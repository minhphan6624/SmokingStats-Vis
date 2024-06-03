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
            .range(["#fbb4ae","#b3cde3","#ccebc5","#decbe4","#fed9a6","#ffffcc","#e5d8bd","#fddaec","#f2f2f2"]);

var datasetSelect = d3.select("#dataset-select");

function parseCigarettesData(data) {
    var countryData = {};
    data.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d.Code; // Country code remains a string
        var value = +d.Value; // Convert Value to number

        if (!countryData[code]) {
            countryData[code] = {};
        }
        countryData[code][year] = { cigarettes: value, tobacco: 0, vape: 0 }; // Only cigarettes consumption for this dataset
    });
    return countryData;
}

function parseVapingTobaccoData(data) {
    
    var countryData = {};

    data.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d["Country Code"]; // Country code remains a string
        var tobaccoValue = +d["Observed Persons"]; // Tobacco consumption
        var vapeValue = +d["Vaping Observed Persons"]; // Vaping consumption

        if (!countryData[code]) {
            countryData[code] = {};
        }
        if (!countryData[code][year]) {
            countryData[code][year] = { cigarettes: 0, tobacco: 0, vape: 0 };
        }
        countryData[code][year].tobacco = tobaccoValue;
        countryData[code][year].vape = vapeValue;
    });
    return countryData;
}
            
function loadDataAndRender(dataset) {
    var csvFile = dataset === "cigarettes" ? "consumption-per-smoker-per-day.csv" : "VapingTobacco.csv";

    d3.csv(`../data/${csvFile}`).then((data) => {
        var countryData;

        if (dataset === "cigarettes") {
            countryData = parseCigarettesData(data);
        } else {
            countryData = parseVapingTobaccoData(data);
        }

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
            var paths = mapSvg.selectAll("path").data(json.features);

            paths.enter()
                .append("path")
                .attr("d", path)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .merge(paths)
                .attr("fill", d => {
                    var value = d.properties.values[1980]; // Default year
                    return value ? color(value) : "#ccc";
                });

            paths.exit().remove();

            var slider = d3.select("#year-slider"); // Select the year slider
            var selectedYearLabel = d3.select("#selected-year"); // Select the year label associated with the label

            // Update the data upon change
            slider.on("input", () => {
                var selectedYear = slider.node().value;
                selectedYearLabel.text(selectedYear);
                updateMap(selectedYear);
            });

            // Initial map display
            updateMap(slider.node().value);

            function updateMap(selectedYear) {
                var selectedType = datasetSelect.node().value;
                var values = json.features.map(d => d.properties.values[selectedYear]?.[selectedType]);
                var minValue = d3.min(values);
                var maxValue = d3.max(values);

                color.domain([minValue, maxValue]);

                // Update map colors based on the selected year and selected type
                mapSvg.selectAll("path")
                    .attr("fill", d => {
                        var value = d.properties.values[selectedYear]?.[selectedType];
                        return value ? color(value) : "#ccc";
                    });
            }
        });
    });
}

// Load initial data
loadDataAndRender(datasetSelect.node().value);

// Update data when a new dataset is selected
datasetSelect.on("change", function() {
    loadDataAndRender(this.value);
});
// //Load data from consumption per smoker per day csv
// d3.csv("../data/consumption-per-smoker-per-day.csv").then((data) => {
    
//         var countryData = {};
//         data.forEach(d => {
//             var year = +d.Year; // Convert Year to number
//             var code = d.Code; // Country code remains a string
//             var value = +d.Value; // Convert Value to number
    
//             if (!countryData[code]) {
//                 countryData[code] = {};
//             }
//             countryData[code][year] = value;
//         });
    
//         // Load in GeoJSON data
//         d3.json("scripts/worldMap.json").then(function (json) {

//             // Merge csv data and GeoJSON
//             json.features.forEach(feature => {
//                 var code = feature.properties.iso_a3;
//                 if (countryData[code]) {
//                     feature.properties.values = countryData[code];
//                 } else {
//                     feature.properties.values = {}; // If no data, set an empty object
//                 }
//             });
    
//             // Bind data and create one path per GeoJSON feature
//             mapSvg.selectAll("path")
//                 .data(json.features)
//                 .enter()
//                 .append("path")
//                 .attr("d", path)
//                 .attr("stroke", "#fff")
//                 .attr("stroke-width", 1);
    
//             // Select the year slider
//             var slider = d3.select("#year-slider");
//             var selectedYearLabel = d3.select("#selected-year"); //Select the year label associated with the label

//             //Update the data upon change
//             slider.on("input", () => {
//                 var selectedYear = slider.node().value;
//                 selectedYearLabel.text(selectedYear);
//                 updateMap(selectedYear);
//             });
    
//             // Initial map display
//             updateMap(slider.node().value);

    
//             function updateMap(selectedYear) {
//                 var values = json.features.map(d => d.properties.values[selectedYear]);
//                 var minValue = d3.min(values);
//                 var maxValue = d3.max(values);
            
//                 color.domain([minValue, maxValue]);
            
//                 // Update map colors based on the selected year
//                 mapSvg.selectAll("path")
//                     .attr("fill", d => {
//                         var value = d.properties.values[selectedYear];
//                         return value ? color(value) : "#ccc";
//                     });
//             }
//         });
// })
