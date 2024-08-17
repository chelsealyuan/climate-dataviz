/*
 * MapVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: not quite sure yet
 * @param _countryChange		-- event handler for country changing
 * @param _timelineChange		-- event handler for timeline changing
 */

CO2Vis = function (_parentElement, _data, _countryChange, _timelineChange) {
  this.parentElement = _parentElement;
  this.co2Data = _data[0];
  this.iso_codeChange = _countryChange;
  this.timelineChange = _timelineChange;

  this.filteredData = this.co2Data;
  this.startYear = 1900;

  this.initVis();
};

CO2Vis.prototype.initVis = function () {
  var vis = this;

  vis.margin = { top: 10, right: 20, bottom: 60, left: 50 };

  vis.width =
    $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right;
  vis.height = 500 - vis.margin.top - vis.margin.bottom;

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width)
    .attr("height", vis.height + vis.margin.bottom)
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    )
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
    .style("-webkit-tap-highlight-color", "transparent")
    .style("overflow", "visible");

  //group data by country name
  vis.filteredData = d3.group(vis.filteredData, (d) => d.iso_code);

  //set default country
  vis.currentCountry = "USA";

  vis.wrangleData();
};

CO2Vis.prototype.wrangleData = function () {
  var vis = this;

  //get data of current country
  vis.countryData = vis.filteredData.get(vis.currentCountry);

  //filter country data at correct start date
  vis.countryData = vis.countryData.filter(function (d) {
    return d.year >= vis.startYear;
  });

  // Update the visualization
  vis.updateVis();
};

CO2Vis.prototype.updateVis = function () {
  var vis = this;

  //let countryName = vis.countryData[0].country;
  d3.select("#vis1-button")
    .text("CO2 Emissions by the Average Person")
    .append("div")
    .attr("class", "arrow down");

  // Scales and axes
  vis.x = d3.scaleLinear().range([0, vis.width]);
  vis.y = d3.scaleLinear().range([vis.height, 0]);

  vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format("d"));
  vis.yAxis = d3.axisLeft().scale(vis.y);

  // Set domains
  var minMaxX = [
    d3.min(
      vis.countryData.map(function (d, i) {
        return d.year;
      })
    ),
    d3.max(
      vis.countryData.map(function (d, i) {
        return d.year;
      })
    ),
  ];

  var maxY = d3.max(
    vis.countryData.map(function (d, i) {
      return d.co2_per_capita;
    })
  );

  if (maxY > 25) {
    minMaxY = [0, maxY + 10];
  } else {
    minMaxY = [0, 26];
  }

  vis.x.domain(minMaxX);
  vis.y.domain(minMaxY);

  //append axes to svg
  vis.svg
    .append("g")
    .attr("class", "x-axis axis")
    .attr("transform", "translate(0," + vis.height + ")");

  //call axes
  vis.svg.selectAll(".tick").remove();

  vis.svg.select(".x-axis").call(vis.xAxis);


  /* Y-Axis format style from Mike Bostock: https://observablehq.com/@d3/line-with-co2_tooltip*/
  vis.svg
  .append("g")
  .call(vis.yAxis)
  .call((g) => g.select(".domain").remove())
  .call((g) =>
    g
      .selectAll(".tick line")
      .clone()
      .attr("x2", vis.width)
      .attr("stroke-opacity", 0.1)
  )
  .attr("class", "y-axis axis");
   

  //add axis labels
  vis.svg.selectAll(".label").remove();

  vis.svg
    .append("text")
    .attr("class", "x-axis label")
    .attr("text-anchor", "end")
    .attr("x", vis.width / 2)
    .attr("y", vis.height + vis.margin.bottom / 1.2)
    .text("Year");

  vis.svg
    .append("text")
    .attr("class", "y-axis label")
    .attr("x", 0)
    .attr("y", 0)
    .attr(
      "transform",
      "translate(" +
        -vis.margin.left / 1.5 +
        "," +
        vis.height / 1.5 +
        ") rotate(-90)"
    )
    .text("CO2 per capita (tons)");

  //create line chart for CO2

  let lines = vis.svg.selectAll(".line").data([vis.countryData]);

  lines = lines.enter().append("path").attr("class", "line").merge(lines);

  lines.attr(
    "d",
    d3
      .line()
      .x(function (d) {
        return vis.x(d.year);
      })
      .y(function (d) {
        return vis.y(d.co2_per_capita);
      })
  );

  //Line chart animation from Louise Moxy https://medium.com/@louisemoxy/create-a-d3-line-chart-animation-336f1cb7dd61 */
  const transitionPath = d3.transition().duration(2000);
  const pathLength = lines.node().getTotalLength();

  lines
    .attr("stroke-dashoffset", pathLength)
    .attr("stroke-dasharray", pathLength)
    .transition(transitionPath)
    .attr("stroke-dashoffset", 0);

  //APPEND TOOLTIP
  /* Referenced from Mike Bostock: https://observablehq.com/@d3/line-with-co2_tooltip*/
  vis.svg
    .on("pointerenter pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", (event) => event.preventDefault());

  var x = (d) => d.year;
  var y = (d) => d.co2_per_capita;

  const X = d3.map(vis.countryData, x);
  const Y = d3.map(vis.countryData, y);
  const O = d3.map(vis.countryData, (d) => d);

  // Compute titles
  var title = (i) => `${X[i]}\n${Y[i] + " tons"}`;

  const co2_tooltip = vis.svg
    .append("g")
    .style("pointer-events", "none")
    .attr("id", "co2-tooltip");

  function pointermoved(event) {
    const i = d3.bisectCenter(X, vis.x.invert(d3.pointer(event)[0]));
    co2_tooltip.style("display", null);
    co2_tooltip.attr("transform", `translate(${vis.x(X[i])},${vis.y(Y[i])})`);

    const path = co2_tooltip
      .selectAll("path")
      .data([,])
      .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");

    const text = co2_tooltip
      .selectAll("text")
      .data([,])
      .join("text")
      .call((text) =>
        text
          .selectAll("tspan")
          .data(`${title(i)}`.split(/\n/))
          .join("tspan")
          .attr("x", 0)
          .attr("y", (_, i) => `${i * 1.1}em`)
          .attr("font-weight", (_, i) => (i ? null : "600"))
          .text((d) => d)
      );

    const { x, y, width: w, height: h } = text.node().getBBox();
    text.attr("transform", `translate(${-w / 2},${15 - y})`);
    path.attr(
      "d",
      `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`
    );
    vis.svg.property("value", O[i]).dispatch("input", { bubbles: true });
  }

  function pointerleft() {
    co2_tooltip.style("display", "none");
    vis.svg.node().value = null;
    vis.svg.dispatch("input", { bubbles: true });
  }
};

CO2Vis.prototype.selectionChanged = function (currentCountry) {
  var vis = this;
  vis.currentCountry = currentCountry;
  vis.wrangleData();
};
