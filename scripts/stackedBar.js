//Globals to be shared between charts
//https://stackoverflow.com/questions/46476426/how-do-i-share-a-global-variable-between-multiple-files

//Width and height
var w = 800;
var h = 600;

//Mike Bostock Margin Convention - https://observablehq.com/@d3/margin-convention
margin = ({top: 70, right:60, bottom: 80, left: 60});
    
var formatter = d3.format(".4~s"); //https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1

// Chart colours
var colours = d3.scaleOrdinal(["#69b3a2", "#404080"]);

// initial chart and values
var selectedCountry = "Australia";
window.selectedCountry = selectedCountry;
lastClickedCountry = selectedCountry;
var selectedSex = "Total";
var clickedYear = 2000;

// Create SVG element
var svg = d3.select(".vis3")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

// --------------------------------------------- Tooltip ---------------------------------------------

// Create hover tooltip - https://d3-graph-gallery.com/graph/barplot_stacked_hover.html
var tooltip = d3.select(".vis3")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

// change tooltip based on mouseover
var mouseover = function(event, d) {
    d3.select(this).transition()
        .duration(400)
        .style("opacity", 1);
    var subgroupName = d3.select(this.parentNode).datum().key;
    var subgroupValue = formatter(d.data[subgroupName]);
    tooltip.html("<strong>" + subgroupName + "</strong><br>" + "# of People: " + subgroupValue + "<br>" + "Sex: " + selectedSex + "<br>" + "Country: " + selectedCountry)
            .style("opacity", 1);
}
// change tooltip based on mousemove
var mousemove = function(event, d) {
    tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
}
// change tooltip based on mouseleave
var mouseleave = function(event, d) {
    d3.select(this).transition()
    .duration(400)
    .style("opacity", 0.85);
    tooltip.style("opacity", 0);
}

function barClicked(event, d) {
    // Get the year of the clicked bar
    window.clickedYear = d.data.Year;
    console.log(clickedYear);
}

//Load data from csv file
d3.csv("data/VapingTobacco.csv").then((data) => {

    var countries = [...new Set(data.map(function(d) { return d.Country; }))];
    countries.sort();

    // Create dropdown list --- https://stackoverflow.com/questions/42209058/making-a-drop-down-menu-from-csv-data-in-js
    var dropdown = d3.select(".dropdown-country")
    .append("select") //html select element
    .attr("id", "countrySelect")
    .selectAll("option") // add to countries list
    .data(countries) // bind to option
    .enter()
    .append("option") //display options
    .text(function(d) { return d; }); //display names of options

    
    // --------------- Initial Chart ---------------
    function initialiseChart() {
        
        // Add groups for main bar chart
        svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        // Create x and y axes containers
        svg.append("g") // group x axis elements
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (h - margin.bottom) + ")");

        svg.append("g") // group y axis elements
            .attr("class", "axis y-axis")
            .attr("transform", "translate(" + (margin.left) + ",0)");

        updateData(selectedCountry, selectedSex);
    }

    // --------------- Update Chart ---------------
    function updateStackedBarChart(filteredData) {
        // Sort filteredData by Year
        filteredData.sort(function(a, b) {
            return d3.ascending(a.Year, b.Year);
        });
    
        // Set up stack
        var stack = d3.stack()
            .keys(["Smoking", "Vaping"]);
    
        // Data, stacked
        var series = stack(filteredData);
    
        // Set up scales
        var xScale = d3.scaleBand()
            .domain(filteredData.map(function(d) { return d.Year; }))
            .range([margin.left, w - margin.right]) // range for visualisation
            .padding(0.1); // Add padding between bars
    
        var yScale = d3.scaleLinear()
            .domain(countryYDomain)
            .range([h - margin.bottom, margin.top]); // range for visualisation of screen based on SVG canvas
    
        // Select SVG element
        var svg = d3.select(".vis3 svg");

        //legend
        svg.append("circle").attr("cx", w/2-80).attr("cy", h-margin.bottom+40).attr("r", 6).style("fill", colours(0))
        svg.append("circle").attr("cx", w/2+60).attr("cy", h-margin.bottom+40).attr("r", 6).style("fill", colours(1))
        svg.append("text").attr("x", w/2-70).attr("y", h-margin.bottom+42).text("Smoking").style("font-size", "15px").attr("alignment-baseline","middle")
        svg.append("text").attr("x", w/2+70).attr("y", h-margin.bottom+42).text("Vaping").style("font-size", "15px").attr("alignment-baseline","middle")
            
        // Add a group for each row of data
        var groups = svg.selectAll("g.layer")
            .data(series, function(d) { return d.key; });
    
        groups.enter()
            .append("g")
            .attr("class", "layer")
            .style("fill", function (d, i) {
                return colours(i);
            });
        
        groups.exit().remove();

        // Create chart bars
        var bars = groups.selectAll("rect")
            .data(function(d) { return d; }, function(d) { return d.data.Year; }); // Bind data and years key to bars

        //Transitions based on Bostock's General Update Pattern III - https://gist.github.com/mbostock/3808234 & https://github.com/shanegibney/D3-v4-Bar-Chart-Update-Pattern/blob/master/index.html
        //EXIT old bars not present in new data - shrink to x axis and remove
        bars.exit()
        .transition("bars")
        .ease(d3.easeCubicOut)
        .delay(100)
        .duration(800)
        .attr("y", function(d) { return h-margin.bottom; })
        .attr("height", 0)
        .remove();

        //UPDATE old bars present in new data - move to year and new height
        bars.transition("bars")
        .ease(d3.easeCubicOut)
        .delay(900)
        .duration(800)
        .attr("x", function(d) { return xScale(d.data.Year); })
        .attr("y", function(d) { return yScale(d[1]); })
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
        .attr("width", xScale.bandwidth())
        .style("stroke", function(d) { return d.data.Year == clickedYear ? "black" : "none"; })
        .style("stroke-width", function(d) { return d.data.Year == clickedYear ? "2px" : "0"; });

        //ENTER new bars present in new data - grow from x axis to new height
        bars.enter()
        .append("rect")
        .attr("x", (function(d) { return xScale(d.data.Year); }))
        .attr("y", function(d) { return h - margin.bottom; })
        .attr("height", function(d) { return 0; })
        .attr("width", xScale.bandwidth())
        .style("opacity", 0.85)
        .style("stroke", function(d) { return d.data.Year == clickedYear ? "black" : "none"; })
        .style("stroke-width", function(d) { return d.data.Year == clickedYear ? "2px" : "0"; })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", barClicked)
        .transition("bars")
        .delay(1700)
        .ease(d3.easeCubicOut)
        .duration(800)
        .attr("y", function(d) { return yScale(d[1]); })
        .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); });

        // Create x and y axes
        var xAxis = d3.axisBottom(xScale).tickSize(0);
        var yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(formatter);
    
        svg.select(".x-axis")
            .transition("axis")
            .ease(d3.easeCubicInOut)
            .delay(600)
            .duration(1000)
            .call(xAxis)
            .select(".domain").remove();

    
        svg.select(".y-axis")
            .transition("axis")
            .ease(d3.easeCubicInOut)
            .delay(900)
            .duration(800)
            .call(yAxis)
            .select(".domain").remove();
    }

    // update vis based on user selections - country and sex
    function updateData(selectedCountry, selectedSex) {
        // update title
        d3.select(".stacked-title").text("Smoking and Vaping in " + selectedCountry + ", " + (selectedSex == "Total" ? "All" : selectedSex + "s Only"));
        //filter based on country only
        var countryData = data.filter(function(d) {
            return d.Country == selectedCountry;
        }).map(function(d) {
            return {
                Year: d.Year,
                Smoking: +d["Observed Persons"],
                Vaping: +d["Vaping Observed Persons"]
            };
        });

        // Check if there's data for the selected country
        if (countryData.length == 0) {
            d3.select(".stacked-title").text("No data available for " + selectedCountry); //update title
        }

        //make series using only country to maintain y domain between sexes
        var tempStack = d3.stack().keys(["Smoking", "Vaping"]);
        var tempSeries = tempStack(countryData);

        //country y domain
        countryYDomain = ([0,
            d3.max(tempSeries, function (d) {
                return d3.max(d, function(d) { return d[1]; }); 
            })
        ]);

        //complete filtering with sex as well
        var filteredData = data.filter(function(d) {
            return d.Country == selectedCountry  && d.Sex == selectedSex;
        }).map(function(d) {
            return {
                Year: d.Year,
                Smoking: +d["Observed Persons"],
                Vaping: +d["Vaping Observed Persons"]
            };
        });
        updateStackedBarChart(filteredData);
    }

    initialiseChart();

    // Event listener of dropdown list
    d3.select("#countrySelect").on("change", function() {
        selectedCountry = d3.select(this).property("value");
        updateData(selectedCountry, selectedSex);
    });

    // --------------------------------------------- Event listeners for sex filtering buttons ---------------------------------------------
    d3.select("#filter-all").on("click", function() {
        selectedSex = "Total";
        window.selectedSex = selectedSex;
        updateData(selectedCountry, selectedSex);
    });

    d3.select("#filter-male").on("click", function() {
        selectedSex = "Male";
        window.selectedSex = selectedSex;
        updateData(selectedCountry, selectedSex);
    });

    d3.select("#filter-female").on("click", function() {
        selectedSex = "Female";
        window.selectedSex = selectedSex;
        updateData(selectedCountry, selectedSex, 'sex');
    });



    //listen for changes to country global from choro - https://stackoverflow.com/questions/65937827/listen-to-js-variable-change
    function setCountryListener() {
        var previousCountry = window.selectedCountry;
    
        const readyListener = () => {
            if (window.selectedCountry && window.selectedCountry != previousCountry) {
                // Set the dropdown value to window.selectedCountry - https://d3js.org/d3-selection/modifying#selection_property
                d3.select("#countrySelect").property("value", window.selectedCountry);
                updateData(window.selectedCountry, selectedSex);
                previousCountry = window.selectedCountry; // Update the previous country
            }
            setTimeout(readyListener, 250);
        };
        readyListener();
    }

    //listen for changes to year selected in slider and bars - https://stackoverflow.com/questions/65937827/listen-to-js-variable-change
function setYearListener() {
    var previousYear = 2000;

    const readyListener = () => {
        if (window.clickedYear && window.clickedYear != previousYear) {
            console.log(clickedYear);
            updateData(window.selectedCountry, selectedSex);
            previousYear = window.clickedYear; // Update the previous country
        }
        setTimeout(readyListener, 250);
    };
    readyListener();
}

    setCountryListener();
    setYearListener();
    window.selectedSex = selectedSex;
    window.window.clickedYear = window.clickedYear;
    updateData(selectedCountry, selectedSex);
});
