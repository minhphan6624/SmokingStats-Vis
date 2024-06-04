//Linking data vis - https://stackoverflow.com/questions/46476426/how-do-i-share-a-global-variable-between-multiple-files
var w = 800;
var h = 500;

var formatter = d3.format(".4~s"); //https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1

//Create SVG element
var mapSvg = d3.select(".vis2")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "grey");

//Set up projection
var projection = d3.geoNaturalEarth1()
    .translate([w / 2, h / 2])
    .scale(150);

//Define path generator
var path = d3.geoPath()
    .projection(projection);

// Define the zoom behavior
// References: https://d3js.org/d3-zoom

var zoom = d3.zoom()
    .scaleExtent([1, 8]) // Define the scale extent
    .on("zoom", zoomed);

// Apply the zoom behavior to the SVG element
mapSvg.call(zoom);

// Function to handle zoom events
function zoomed(event) {
    mapSvg.selectAll('path') // Select all paths (countries)
        .attr('transform', event.transform); // Apply the transform
}

//Country click event handler
function countryClicked(event, d) {
    console.log(d.properties.name);
    window.countrySe = d.properties.name;
}

// Define color range
var color = d3.scaleQuantize()
    .range(["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"]);

// Dropdown box to select the datasets
var datasetSelect = d3.select("#dataset-select");


// --------------- Tooltip ---------------

// Define the tooltip
var tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("pointer-events", "none");

//Callback function for mouse out event
let mouseOutCallBack = function (d) {
    d3.select(this).attr("stroke", "#000").attr("stroke-width", 0.25); // Reset border
    tooltip.transition().duration(500).style("opacity", 0);
}

//Callback function for mouse move
let mouseMoveCallBack = function (event) {
    tooltip.style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
}

// --------------- Parser Functions ---------------

//Parse data from cigarettes consumption csv 
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

function parseTobaccoData(data) {
    var countryData = {};
    var filteredData = data.filter(d => d.Sex === window.selectedSex);
    console.log(window.selectedSex);
    filteredData.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d["Country Code"]; // Country code remains a string
        var tobaccoValue = +d["Observed Persons"]; // Tobacco consumption

        if (!countryData[code]) {
            countryData[code] = {};
        }
        if (!countryData[code][year]) {
            countryData[code][year] = { cigarettes: 0, tobacco: 0, vape: 0 };
        }
        countryData[code][year].tobacco = tobaccoValue;
    });
    return countryData;
}

//Parse data from vaping.csv file
function parseVapingData(data) {
    var countryData = {};
    data.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d["Country Code"]; // Country code remains a string
        var vapeValue = +d["Observed Persons"]; // Vaping consumption

        if (!countryData[code]) {
            countryData[code] = {};
        }
        if (!countryData[code][year]) {
            countryData[code][year] = { cigarettes: 0, tobacco: 0, vape: 0 };
        }
        countryData[code][year].vape = vapeValue;
    });
    return countryData;
}


// --------------- Main Rendering method ---------------

//Load data from csv files and render the choropleths
function loadDataAndRender(dataset) {

    var csvFile;
    var parserFunction;
    var yearRange;

    //Select file, parser function and year range according to the dropdown
    if (dataset === "cigarettes") {
        csvFile = "consumption-per-smoker-per-day.csv";
        parserFunction = parseCigarettesData;
        yearRange = { min: 1980, max: 2012 };
    } else if (dataset === "tobacco") {
        csvFile = "tobacco.csv";
        parserFunction = parseTobaccoData;
        yearRange = { min: 2000, max: 2022 };
    } else {
        csvFile = "vaping.csv";
        parserFunction = parseVapingData;
        yearRange = { min: 2012, max: 2022 };
    }

    d3.csv(`../data/${csvFile}`).then((data) => {

        //Get the country csv data based on using the corresponding parser functions
        var countryData = parserFunction(data);

        // Load in GeoJSON data
        d3.json("scripts/worldMap1.json").then(function (json) {

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
                .attr("stroke", "black")
                .attr("stroke-width", 0.25)
                .merge(paths)
                .attr("fill", d => {
                    var value = d.properties.values[yearRange.min]?.[dataset]; // Default year, selected dataset value
                    return value ? color(value) : "#ccc";
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 1); // Highlight border
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(d.properties.name + "<br/>" + d.properties.values[yearRange.min]?.[dataset])
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", mouseMoveCallBack)
                .on("mouseout", mouseOutCallBack)
                .on("click", countryClicked);

            paths.exit().remove();

            // Update year slider
            var slider = d3.select("#year-slider");
            slider.attr("min", yearRange.min)
                .attr("max", yearRange.max)
                .attr("value", yearRange.min);

            var selectedYearLabel = d3.select("#selected-year"); // Select the year label associated with the label

            // Update the data upon change
            slider.on("input", () => {
                var selectedYear = slider.node().value;
                selectedYearLabel.text(selectedYear);
                updateMap(selectedYear);
            });

            // Initial map display
            updateMap(slider.node().value);

            //Update map based on the selected year
            function updateMap(selectedYear) {

                //Get the current dataset that are being examined
                var selectedType = datasetSelect.node().value;

                var values = json.features.map(d => d.properties.values[selectedYear]?.[selectedType]);

                var minValue = d3.min(values);
                var maxValue = d3.max(values);

                //Reset the color domain based on the min and max values
                color.domain([minValue, maxValue]);

                // Update map colors based on the selected year and selected type
                mapSvg.selectAll("path")
                    .attr("fill", d => {
                        var value = d.properties.values[selectedYear]?.[selectedType];
                        return value ? color(value) : "#ccc";
                    })
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1); // Highlight border
                        tooltip.transition().duration(200).style("opacity", .9);
                        tooltip.html(d.properties.name + "<br/>" + d.properties.values[selectedYear]?.[selectedType])
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", mouseMoveCallBack)
                    .on("mouseout", mouseOutCallBack);
            }
        });
    });
}

// Load initial data
loadDataAndRender(datasetSelect.node().value);

// Update data when a new dataset is selected
datasetSelect.on("change", function () {
    loadDataAndRender(this.value);
});


