// Sample data
const flare = {
    name: "flare",
    children: [
      {
        name: "analytics",
        children: [
          { name: "cluster", size: 3938 },
          { name: "graph", size: 3534 },
          { name: "optimization", size: 5731 }
        ]
      },
      {
        name: "animate",
        children: [
          { name: "interpolate", size: 8746 },
          { name: "pause", size: 9123 }
        ]
      }
    ]
  };
  
  // Treemap chart function
  const chart = (data) => {
    // Create hierarchy and sum the sizes
    const root = d3.hierarchy(data)
      .sum(d => d.size)
      .sort((a, b) => b.height - a.height || b.value - a.value);
  
    // Create treemap layout
    d3.treemap()
      .size([800, 600])
      .padding(1)
      .round(true)
      (root);
  
    console.log("Treemap root:", root); // Debugging log
  
    // Create SVG container
    const svg = d3.select(".vis1")
      .append("svg")
      .attr("width", 800)
      .attr("height", 600)
      .style("font", "10px sans-serif")
      .style("border", "1px solid black"); // Add border to see the SVG area
  
    // Create nodes
    const node = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);
  
    // Add rectangles
    // node.append("rect")
    //   .attr("id", d => (d.leafUid = d3.uid("leaf")).id)
    //   .attr("width", d => {
    //     console.log("Rectangle width:", d.x1 - d.x0); // Debugging log
    //     return d.x1 - d.x0;
    //   })
    //   .attr("height", d => {
    //     console.log("Rectangle height:", d.y1 - d.y0); // Debugging log
    //     return d.y1 - d.y0;
    //   })
    //   .attr("fill", d => d3.schemeTableau10[d.data.name.length % 10])
    //   .attr("stroke", "black") // Add stroke for better visibility
    //   .attr("fill-opacity", 1); // Ensure fill opacity is 1 for full visibility
  
    // Add text
    // node.append("text")
    //   .attr("clip-path", d => d.clipUid)
    //   .selectAll("tspan")
    //   .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
    //   .enter()
    //   .append("tspan")
    //   .attr("x", 3)
    //   .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
    //   .text(d => d)
    //   .attr("fill", "black"); // Ensure text is visible
  
    //return svg.node();
  };
  
  // Call the chart function with the sample data
  chart(flare);
  