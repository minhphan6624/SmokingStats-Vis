const width = 800;
const height = 600;
const padding = 60;

// Function to update the line chart based on the selected country and sex
function updateLineChart(selectedCountry, selectedSex) {
    d3.csv("data/consumption-per-smoker-per-day.csv").then(data => {
        const dataset = parseCigarettesDataForCountry(data, selectedCountry);
        updateLineTitle(selectedCountry, selectedSex); // Update the title
        drawLineChart(dataset);
    });
}

var formatter = d3.format(".2f");

// Function to parse data for a specific country
function parseCigarettesDataForCountry(data, countryCode) {
    return data.filter(d => d.Code === countryCode).map(d => ({
        year: +d.Year,
        value: +d.Value
    }));
}

// Function to update the line chart title
function updateLineTitle(selectedCountry, selectedSex) {
    d3.select(".line-title").text("Cigarette Consumption per Smoker per Day in " + selectedCountry);
}

// Function to draw the line chart
function drawLineChart(dataset) {
    // Remove any existing SVG
    d3.select(".vis4").selectAll("svg").remove();

    // Create SVG
    const svg = d3.select(".vis4").append("svg")
        .attr("width", width)
        .attr("height", height);

    // Scales
    const xScale = d3.scaleLinear()
        .domain(d3.extent(dataset, d => d.year))
        .range([padding, width - padding]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d.value)])
        .range([height - padding, padding]);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("transform", `translate(0, ${height - padding})`)
        .call(xAxis);

    svg.append("g")
        .attr("transform", `translate(${padding}, 0)`)
        .call(yAxis);

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value));

    // Draw the line with transition
    const path = svg.append("path")
        .datum(dataset)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#69b3a2")
        .attr("stroke-width", 2);

    // Transition (https://medium.com/@louisemoxy/create-a-d3-line-chart-animation-336f1cb7dd61)
    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Tooltip and interaction (https://d3-graph-gallery.com/graph/line_cursor.html)
    const focus = svg.append('g')
        .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 8.5)
        .style("opacity", 0);

    const focusText = svg.append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle");

    svg.append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    const bisect = d3.bisector(d => d.year).left;

    function mouseover() {
        focus.style("opacity", 1);
        focusText.style("opacity", 1);
    }

    function mousemove(event) {
        const x0 = xScale.invert(d3.pointer(event)[0]);
        const i = bisect(dataset, x0);
        const selectedData = i === dataset.length ? dataset[i - 1] : dataset[i];
        focus
            .attr("cx", xScale(selectedData.year))
            .attr("cy", yScale(selectedData.value));
        focusText
            .html(null)
            .append('tspan')
            .attr('x', xScale(selectedData.year) - 40)
            .attr('dy', '1.5em')
            .text(`Year: ${selectedData.year}`)
            .append('tspan')
            .attr('x', xScale(selectedData.year) - 40)
            .attr('dy', '1.2em')
            .text(`Value: ${formatter(selectedData.value)}`);
    }

    function mouseout() {
        focus.style("opacity", 0);
        focusText.style("opacity", 0);
    }

    svg.selectAll("circle.data-point")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 3)
        .attr("fill", "#404080")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Year: ${d.year}<br>Value: ${formatter(d.value)}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
}

// Initialize line chart with default values
updateLineChart("AUS", "Total");

// Listen for country and sex changes to update the line chart
d3.select("#countrySelect").on("change", function() {
    selectedCountry = d3.select(this).property("value");
    updateLineChart(selectedCountry, selectedSex);
});

d3.select("#filter-all").on("click", function() {
    selectedSex = "Total";
    updateLineChart(selectedCountry, selectedSex);
});

d3.select("#filter-male").on("click", function() {
    selectedSex = "Male";
    updateLineChart(selectedCountry, selectedSex);
});

d3.select("#filter-female").on("click", function() {
    selectedSex = "Female";
    updateLineChart(selectedCountry, selectedSex);
});
