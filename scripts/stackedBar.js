//Globals to be shared between charts
//https://stackoverflow.com/questions/46476426/how-do-i-share-a-global-variable-between-multiple-files

//Width and height
var w = 800;
var h = 300;

//Mike Bostock Margin Convention - https://observablehq.com/@d3/margin-convention
margin = ({top: 20, right: 150, bottom: 30, left: 60});
    
var formatter = d3.format(".4~s"); //https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1

//Load data from csv file
d3.csv("../data/VapingTobacco.csv").then((data) => {

    // initial chart and values
    var selectedCountry = "Australia";
    var selectedSex = "Total";

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

    function initializeChart() {
        // Create SVG element
        var svg = d3.select(".vis3")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // Create x and y axes containers
        svg.append("g") // group x axis elements
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (h - margin.bottom) + ")");

        svg.append("g") // group y axis elements
            .attr("class", "y-axis")
            .attr("transform", "translate(" + (margin.left) + ",0)");
    }

    function updateChart(filteredData) {
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
            .range([margin.left, w - margin.right]) // range for visualization
            .padding(0.1); // Add padding between bars
    
        var yScale = d3.scaleLinear()
            .domain(countryYDomain)
            .range([h - margin.bottom, margin.top]); // range for visualization of screen based on SVG canvas
    
        // Easy colours accessible via a 10-step ordinal scale
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
    
        // Select SVG element
        var svg = d3.select(".vis3 svg");

        svg.append("circle").attr("cx",700).attr("cy",130).attr("r", 6).style("fill", "#69b3a2")
        svg.append("circle").attr("cx",700).attr("cy",160).attr("r", 6).style("fill", "#404080")
        svg.append("text").attr("x", 715).attr("y", 130).text("Smoking").style("font-size", "15px").attr("alignment-baseline","middle")
        svg.append("text").attr("x", 715).attr("y", 160).text("Vaping").style("font-size", "15px").attr("alignment-baseline","middle")
            
        // Add a group for each row of data
        var groups = svg.selectAll("g.layer")
            .data(series, function(d) { return d.key; });
    
        groups.enter()
            .append("g")
            .attr("class", "layer")
            .style("fill", function (d, i) {
                return colors(i);
            });
    
        groups.exit().remove();
    
        // Create chart bars
        var bars = groups.selectAll("rect")
            .data(function(d) { return d; });
    
        // Handle entering bars
        bars.enter()
            .append("rect")
            .attr("x", function(d) { return xScale(d.data.Year); })
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
            .attr("width", xScale.bandwidth())
            .style("opacity", 0.85)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)
            .on("click", barClicked)
            .merge(bars) // Ensure entering and updating bars are handled
            .transition() // Apply transition to entering and updating bars
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr("x", function(d) { return xScale(d.data.Year); })
            .attr("y", function(d) { return yScale(d[1]); })
            .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
            .attr("width", xScale.bandwidth());
    
        bars.exit().remove();
    
        // Create x and y axes
        var xAxis = d3.axisBottom(xScale).tickSize(0);
        var yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(formatter);
    
        svg.select(".x-axis")
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .call(xAxis);
    
        svg.select(".y-axis")
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .call(yAxis);
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
        updateChart(filteredData);
    }

    initializeChart();

    // Event listener of dropdown list
    d3.select("#countrySelect").on("change", function() {
        selectedCountry = d3.select(this).property("value");
        updateData(selectedCountry, selectedSex);
    });

    // Event listener of buttons
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

    function setCountryListener() {
        const readyListener = () => {
            if (window.countrySe) {
                updateData(window.countrySe, selectedSex);
            }
            return setTimeout(readyListener, 250);
        };
        readyListener();
    }
    

    window.selectedSex = selectedSex;
    updateData(selectedCountry, selectedSex);
});
