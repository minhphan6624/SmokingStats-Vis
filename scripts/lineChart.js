const width = 600;
const height = 300;
const padding = 60;

// Function to update the line chart based on the selected country
function updateLineChart(countryCode) {
    d3.csv("data/consumption-per-smoker-per-day.csv").then(data => {
        const dataset = parseCigarettesDataForCountry(data, countryCode);
        drawLineChart(dataset);
    });
}

var formatter = d3.format(".2f"); //https://github.com/d3/d3/blob/45df8c66dfe43ad0824701f749a9bf4e3562df85/docs/d3-format.md?plain=1

// Function to parse data for a specific country
function parseCigarettesDataForCountry(data, countryCode) {
    return data.filter(d => d.Code === countryCode).map(d => ({
        year: +d.Year,
        value: +d.Value
    }));
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
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Transition (https://medium.com/@louisemoxy/create-a-d3-line-chart-animation-336f1cb7dd61)
    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Tooltip
    // const tooltip = d3.select("body").append("div")
    //     .attr("class", "tooltip")
    //     .style("opacity", 0);

    //Cursor tool tip (https://d3-graph-gallery.com/graph/line_cursor.html)
    // Create the circle that travels along the curve of the chart
    const focus = svg.append('g')
        .append('circle')
        .style("fill", "none")
        .attr("stroke", "black")
        .attr('r', 8.5)
        .style("opacity", 0);

    // Create the text that travels along the curve of the chart
    const focusText = svg.append('g')
        .append('text')
        .style("opacity", 0)
        .attr("text-anchor", "left")
        .attr("alignment-baseline", "middle");

    // Rectangle for capturing mouse movements (tracks it)
    svg.append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', width)
        .attr('height', height)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    // Bisector for finding the closest data point
    const bisect = d3.bisector(d => d.year).left;

    // Mouseover function
    function mouseover() {
        focus.style("opacity", 1);
        focusText.style("opacity", 1);
    }
    

    // Mousemove function
    function mousemove(event) {
        const x0 = xScale.invert(d3.pointer(event)[0]);
        const i = bisect(dataset, x0);
        const selectedData = i === dataset.length ? dataset[i - 1] : dataset[i];
        focus
            .attr("cx", xScale(selectedData.year))
            .attr("cy", yScale(selectedData.value));
        focusText
            .html(null)  // Clear any existing text
            .append('tspan')
            .attr('x', xScale(selectedData.year) - 40)
            .attr('dy', '1.5em') // Position text above the data point
            .text(`Year: ${selectedData.year}`)
            .append('tspan')
            .attr('x', xScale(selectedData.year) - 40)
            .attr('dy', '1.2em')
            .text(`Value: ${formatter(selectedData.value)}`);
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`Year: ${selectedData.year}<br>Value: ${formatter(selectedData.value)}`)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    }
    
    
    

    // Mouseout function
    function mouseout() {
        focus.style("opacity", 0);
        focusText.style("opacity", 0);
        tooltip.transition().duration(500).style("opacity", 0);
    }

    // Draw circles for data points
    svg.selectAll("circle.data-point")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 3)
        .attr("fill", "red")
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

