const width = 1000;
const height = 400;
const padding = 60;

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

    //Transition
    const totalLength = path.node().getTotalLength();

    path.attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Circles with tooltip and transition
    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.value))
        .attr("r", 3)
        .attr("fill", "red")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Year: ${d.year}<br>Value: ${d.value}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });
}

// Function to update the line chart based on the selected country
function updateLineChart(countryCode) {
    d3.csv("data/consumption-per-smoker-per-day.csv").then(data => {
        const dataset = parseCigarettesDataForCountry(data, countryCode);
        drawLineChart(dataset);
    });
}
