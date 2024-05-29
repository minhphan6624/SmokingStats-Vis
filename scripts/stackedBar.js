//Width and height
var w = 800;
var h = 300;

//Mike Bostock Margin Convention - https://observablehq.com/@d3/margin-convention
margin = ({top: 20, right: 60, bottom: 30, left: 60}) //can be further implemented for responsive
    
var selectedSex = "Total";
var selectedCountry = "Australia";

d3.csv("../data/VapingTobacco.csv").then((data) => {

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

    function updateChart(selectedCountry, selectedSex) {
        // Filter rows and select columns
        var filteredData = data.filter(function(d) {
            return d.Sex == selectedSex && d.Country == selectedCountry; //filter based on selected country (Sex can be further implemented for further interactivity)
        }).map(function(d) {
            return {
                Year: d.Year,
                ObservedPersons: +d["Observed Persons"],
                VapingObservedPersons: +d["Vaping Observed Persons"]
            };
        });

        // Sort filteredData by Year
        filteredData.sort(function(a, b) {
            return d3.ascending(a.Year, b.Year);
        });


        //Set up stack 
        var stack = d3.stack()
        .keys(["ObservedPersons", "VapingObservedPersons"]);

        //Data, stacked
        var series = stack(filteredData);

        //Set up scales
        var xScale = d3.scaleBand()
            .domain(filteredData.map(function(d) { return d.Year; }))
            .range([margin.left, w - margin.right]) //range for visualisation
            .padding(0.1); // Add padding between bars

        var yScale = d3.scaleLinear()
            .domain([0,
                d3.max(series, function (d) {
                    return d3.max(d, function(d) { return d[1]; }); 
                })
            ])
            .range([h - margin.bottom, margin.top]); //range for visualisation of screen based on SVG canvas

        //Easy colors accessible via a 10-step ordinal scale
        var colors = d3.scaleOrdinal(d3.schemeCategory10);

        //Remove previous SVG element
        d3.select(".vis3 svg").remove();


        //Create SVG element
        var svg = d3.select(".vis3")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // Add a group for each row of data
        var groups = svg.selectAll("g")
            .data(series)
            .enter()
            .append("g")
            .style("fill", function (d, i) {
                return colors(i);
            });

        // Add a rect for each data value
        var rects = groups.selectAll("rect")
            .data(function (d) { return d; })
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return xScale(d.data.Year);
            })
            .attr("y", function (d) {
                return yScale(d[1]);  // <-- Changed y value
            })
            .attr("height", function (d) {
                return yScale(d[0]) - yScale(d[1]);  // <-- Changed height value
            })
            .attr("width", xScale.bandwidth());


        //https://ghenshaw-work.medium.com/customizing-axes-in-d3-js-99d58863738b
        var xAxis = d3.axisBottom()
        // .select(".domain").remove()
        .scale(xScale)
        .tickSize(0);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(6)
            // .tickSize(0)
            .tickFormat(d3.format("~s")); //https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1

        svg.append("g") //group x axis elements
            .attr("class", "axis") // assign class (name group)
            .attr("transform", "translate(0," + (h - margin.bottom) + ")") //move x axis to bottom of SVG
            .call(xAxis)
            .select(".domain").remove();

        svg.append("g") //group y axis elements
            .attr("class", "axis") // assign class (name group)
            .attr("transform", "translate(" + (margin.left) + ",0)") //move y axis to left of SVG
            .call(yAxis)
            .select(".domain").remove();
    }
        


    // Event listener of dropdown list
    d3.select("#countrySelect").on("change", function() {
        var selectedCountry = d3.select(this).property("value");
        updateChart(selectedCountry, selectedSex);
    });

    // Event listener of buttons
    d3.select("#filter-all").on("click", function() {
        selectedSex = "Total";
        updateChart(selectedCountry, selectedSex);
    });

    d3.select("#filter-male").on("click", function() {
        selectedSex = "Male";
        updateChart(selectedCountry, selectedSex);
    });

    d3.select("#filter-female").on("click", function() {
        selectedSex = "Female";
        updateChart(selectedCountry, selectedSex);
    });

    // initial chart
    updateChart(selectedCountry, selectedSex);
});
