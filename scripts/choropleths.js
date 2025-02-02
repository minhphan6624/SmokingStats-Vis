//Linking data vis - https://stackoverflow.com/questions/46476426/how-do-i-share-a-global-variable-between-multiple-files
var w = 900;
var h = 600;
//https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1
var formatter = d3.format(".4~s"); 

// Define color range
var color = d3.scaleQuantize()
    .range(d3.schemeYlGnBu[9]); // Use a predefined color scheme with 9 discrete colors

//Create SVG element
var mapSvg = d3.select(".vis2")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("fill", "grey");

// Create group for the map
var mapGroup = mapSvg.append("g").attr("class", "mapGroup");

// Create group for the legend
var legendGroup = mapSvg.append("g").attr("class", "legendGroup");

//Set up projection
var projection = d3.geoNaturalEarth1()
                    .translate([w / 2 - 35, h / 2 + 25])
                    .scale(170);

//Define path generator
var path = d3.geoPath()
    .projection(projection);

// --------------------------------------------- Zoom behavior ---------------------------------------------

// References: https://d3js.org/d3-zoom
var zoom = d3.zoom()
    .scaleExtent([1, 8]) // Define the scale extent
    .translateExtent([[0, 0], [w, h]]) // Define the translation extent
    .on("zoom", zoomed);

// Apply the zoom behavior to the SVG element
mapSvg.call(zoom);

// Function to handle zoom events
function zoomed(event) {
    mapGroup.selectAll('path') // Select all paths (countries)
        .attr('transform', event.transform); // Apply the transform
}

// Function to zoom to the bounding box of a continent
function zoomToContinent(boundingBox) {
    var [[x0, y0], [x1, y1]] = boundingBox.map(projection);
    var width = x1 - x0;
    var height = y1 - y0;
    var midX = (x0 + x1) / 2;
    var midY = (y0 + y1) / 2;
    var scale = Math.max(1, Math.min(8, 0.9 / Math.max(width / w, height / h)));
    var translate = [w / 2 - scale * midX, h / 2 - scale * midY];

    mapSvg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}


// Define bounding boxes for continents
var continentBoundingBoxes = {
    "Africa": [[-20, -35], [55, 37]],
    "Asia": [[25, 5], [150, 55]],
    "Europe": [[-30, 35], [45, 70]],
    "North America": [[-170, 15], [-50, 80]],
    "Oceania": [[110, -50], [180, 0]],
    "South America": [[-90, -60], [-30, 15]],
    "All": [[-180, -90], [180, 90]]
};

// Function to zoom to the bounding box of a continent
function zoomToContinent(boundingBox) {
    
    // Transform the bounding box coordinates using the projection
    var [[x0, y0], [x1, y1]] = boundingBox.map(projection); 
    
    // Calculate the width and height of the bounding box
    var width = x1 - x0;
    var height = y1 - y0;

    // Calculate the midpoints of the bounding box
    var midX = (x0 + x1) / 2;
    var midY = (y0 + y1) / 2;

    // Determine the scale factor to fit the bounding box within the view
    var scale = Math.max(1, Math.min(8, 0.9 / Math.max(width / w, height / h)));

    // Calculate the translation to center the bounding box within the view
    var translate = [w / 2 - scale * midX, h / 2 - scale * midY];

    // Apply the zoom transformation with a smooth transition
    mapSvg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// Dropdown box to select the continents
var continentSelect = d3.select("#continent-select");

// Modify the continent change event handler
continentSelect.on("change", function () {
    var selectedContinent = this.value;
    var boundingBox = continentBoundingBoxes[selectedContinent];
    zoomToContinent(boundingBox);
});


// --------------------------------------------- Tooltip ---------------------------------------------

// Define the tooltip
var tooltipMap = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("pointer-events", "none");

//Callback function for mouse out event
let mouseOutCallBack = function (event, d) {
    if (d != lastClickedCountry) { // Check country is not the last clicked country
        d3.select(this).attr("stroke", "black").attr("stroke-width", 0.25); // Reset border
    }
    tooltipMap.transition().duration(500).style("opacity", 0);
}

//Callback function for mouse move
let mouseMoveCallBack = function (event) {
    tooltipMap.style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
}

// --------------------------------------------- Legend ---------------------------------------------

function createLegend(colorScale) {
    var legendWidth = 400;
    var legendHeight = 10;
    var legendPadding = 10;
    var legendRectSize = 50;
    var legendSpacing = 20; // Increase the spacing between legend items

    // Remove any existing legend
    legendGroup.selectAll(".legend").remove();

    var legendSvg = legendGroup.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${w / 2 - legendWidth / 2}, 550)`); // Position the legend at the bottom center

    var legendData = colorScale.range().map(d => {
        var extent = colorScale.invertExtent(d);
        if (!extent[0]) extent[0] = colorScale.domain()[0];
        if (!extent[1]) extent[1] = colorScale.domain()[1];
        return extent;
    });

    var legend = legendSvg.selectAll(".legendItem")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * (legendRectSize)}, 0)`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendRectSize)
        .attr("height", legendHeight)
        .style("fill", d => colorScale(d[0]));

    legend.append("text")
        .attr("x", legendRectSize / 2)
        .attr("y", legendHeight + legendPadding)
        .attr("dy", "0.8em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d3.format(".2")(d[0]));

    // Add "No data" label
    legendSvg.append("text")
        .attr("x", -50)
        .attr("y", legendHeight / 2)
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .text("No data");
}

// --------------------------------------------- Dataset selector ---------------------------------------------

// Dropdown box to select the datasets
var datasetSelect = d3.select("#dataset-select");

// Modify the dataset change event handler
datasetSelect.on("change", function () {
    var selectedDataset = this.value;

    if (selectedDataset === "cigarettes") {
        d3.select(".vis-stacked").style("display", "none");
        d3.select(".vis-line").style("display", "block");
        updateLineChart('AUS'); // Default to Australia when cigarettes dataset is selected
    } else {
        d3.select(".vis-stacked").style("display", "block");
        d3.select(".vis-line").style("display", "none");
        // updateStackedBarChart(selectedDataset); // Update the stacked bar chart for other datasets
    }
    
    loadDataAndRender(selectedDataset);
});

// --------------------------------------------- Continent selector ---------------------------------------------

// Dropdown box to select the continents
var continentSelect = d3.select("#continent-select");

// Modify the continent change event handler
continentSelect.on("change", function () {
    var selectedContinent = this.value;
    var boundingBox = continentBoundingBoxes[selectedContinent];
    zoomToContinent(boundingBox);
});

// --------------------------------------------- Parser Functions ---------------------------------------------

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
    var filteredData = data.filter(d => d.Sex == selectedSex );
    filteredData.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d["Country Code"]; // Country code remains a string
        var tobaccoValue = +d["Observed Percentage"]; // Tobacco consumption

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
    var filteredData = data.filter(d => d.Sex == selectedSex);
    filteredData.forEach(d => {
        var year = +d.Year; // Convert Year to number
        var code = d["Country Code"]; // Country code remains a string
        var vapeValue = +d["Observed Percentage"]; // Vaping consumption

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

// --------------------------------------------- Main Rendering method ---------------------------------------------
//Load data from csv files and render the choropleths
function loadDataAndRender(dataset) {

    var csvFile;
    var parserFunction;
    var yearRange;

    //Select file, parser function and year range according to the dropdown
    if (dataset === "cigarettes") {
        csvFile = "data/consumption-per-smoker-per-day.csv";
        parserFunction = parseCigarettesData;
        yearRange = { min: 1980, max: 2012 };
        d3.select(".source-choro").text("Source: World Health Organization - Global Health Observatory");
    } else if (dataset === "tobacco") {
        csvFile = "data/tobacco.csv";
        parserFunction = parseTobaccoData;
        yearRange = { min: 2000, max: 2022 };
        d3.select(".source-choro").text("Source: OECD Health Stastics");
    } else {
        csvFile = "data/vaping.csv";
        parserFunction = parseVapingData;
        yearRange = { min: 2012, max: 2022 };
        d3.select(".source-choro").text("Source: OECD Health Stastics");
    }

    d3.csv(csvFile).then((data) => {

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
            var paths = mapGroup.selectAll("path").data(json.features);

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
                    tooltipMap.transition().duration(200).style("opacity", .9);
                    tooltipMap.html(d.properties.name + "<br/>" + d.properties.values[yearRange.min]?.[dataset])
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mousemove", mouseMoveCallBack)
                .on("mouseout", mouseOutCallBack)
                .on("click", function (event, d) {
                    mapSvg.selectAll('path').attr("stroke-width", 0.25); // reset all paths
                    d3.select(this).attr("stroke", "#000").attr("stroke-width", 1); // Highlight border of clicked country
                    lastClickedCountry = d; // Store the clicked country
                    window.selectedCountry = d.properties.name; // Store the selected country for stacked

                    // Call the function to update the line chart if the dataset is cigarettes
                    if (dataset === "cigarettes") {
                        updateLineChart(d.properties.iso_a3); // Ensure this function is globally accessible
                    }
                });

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
                window.clickedYear = selectedYear;
                console.log(window.clickedYear);
            });

            // Initial map display
            updateMap(slider.node().value);

            //Update map based on the selected year
            function updateMap(selectedYear) {

                //Get the current dataset that are being examined
                var selectedDataset = datasetSelect.node().value;

                var values = json.features.map(d => d.properties.values[selectedYear]?.[selectedDataset]);

                var minValue = d3.min(values);
                var maxValue = d3.max(values);

                //Reset the color domain based on the min and max values
                color.domain([minValue, maxValue]);

                // Update map colors based on the selected year and selected type
                mapSvg.selectAll("path")
                    .attr("fill", d => {
                        var value = d.properties.values[selectedYear]?.[selectedDataset];
                        return value ? color(value) : "#ccc";
                    })
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("stroke", "#000").attr("stroke-width", 1); // Highlight border
                        tooltipMap.transition().duration(200).style("opacity", .9);
                        tooltipMap.html(d.properties.name + "<br/>" + d.properties.values[selectedYear]?.[selectedDataset])
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mousemove", mouseMoveCallBack)
                    .on("mouseout", mouseOutCallBack);
            }           
        });
    
    });
    // Create or update legend
    createLegend(color);

}

// Load initial data
loadDataAndRender(datasetSelect.node().value);

// --------------- Data Update Listeners - linking stacked ---------------
//listen for changes to year selected in slider and bars - https://stackoverflow.com/questions/65937827/listen-to-js-variable-change
function setYearListener() {
    var previousYear = 2000;

    const readyListener = () => {
        if (window.clickedYear && window.clickedYear != previousYear) {
            console.log(clickedYear);
            // Set the dropdown value to window.selectedCountry - https://d3js.org/d3-selection/modifying#selection_property
            d3.select("#year-slider").property("value", window.clickedYear);
            d3.select("#selected-year").text(window.clickedYear);
            loadDataAndRender(datasetSelect.node().value);
            previousYear = window.clickedYear; // Update the previous country
        }
        setTimeout(readyListener, 250);
    };
    readyListener();
}

//listen for changes to sex global from stacked - https://stackoverflow.com/questions/65937827/listen-to-js-variable-change
function setSexListener() {
    var previousSex = "Total";
    const readyListener = () => {
        if (window.selectedSex && window.selectedSex != previousSex) {
            loadDataAndRender(datasetSelect.node().value);
            previousSex = window.selectedSex; // Update the previous country
        }
        setTimeout(readyListener, 250);
    };
    readyListener();
}

setSexListener();
setYearListener();
