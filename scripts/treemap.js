 // Set the dimensions and margins of the graph
 var margin = {top: 10, right: 10, bottom: 10, left: 10},
 width = 445 - margin.left - margin.right,
 height = 445 - margin.top - margin.bottom;

// Append the svg object to the body of the page
var svg = d3.select(".vis1")
.append("svg")
 .attr("width", width + margin.left + margin.right)
 .attr("height", height + margin.top + margin.bottom)
.append("g")
 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Read SAMPLE data - CHANGE CSV
d3.csv('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/data_hierarchy_1level.csv').then(function(data) {
// Stratify the data: reformatting for d3.js
var root = d3.stratify()
 .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
 .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
 (data);

// Sum the values of each node
root.sum(function(d) { return +d.value; });

// Compute the treemap layout
d3.treemap()
 .size([width, height])
 .padding(4)
 (root);

console.log(root.leaves());  // Debugging log

// Use this information to add rectangles
svg.selectAll("rect")
 .data(root.leaves())
 .enter()
 .append("rect")
   .attr('x', function(d) { return d.x0; })
   .attr('y', function(d) { return d.y0; })
   .attr('width', function(d) { return d.x1 - d.x0; })
   .attr('height', function(d) { return d.y1 - d.y0; })
   .style("stroke", "black")
   .style("fill", "#69b3a2");

// Add text labels
svg.selectAll("text")
 .data(root.leaves())
 .enter()
 .append("text")
   .attr("x", function(d) { return d.x0 + 10; })    // +10 to adjust position (more right)
   .attr("y", function(d) { return d.y0 + 20; })    // +20 to adjust position (lower)
   .text(function(d) { return d.data.name; })
   .attr("font-size", "15px")
   .attr("fill", "white");
}).catch(function(error) {
console.error("Error loading the data: ", error);
});