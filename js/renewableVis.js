/*
 * MapVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: not quite sure yet
 * @param _countryChange		-- event handler for country changing
 * @param _timelineChange		-- event handler for timeline changing
 */

RenewableVis = function (
  _parentElement,
  _data,
  _countryChange,
  _timelineChange
) {
  this.parentElement = _parentElement;
  this.renewableData = _data[0];
  this.iso_codeChange = _countryChange;
  this.timelineChange = _timelineChange;

  this.filteredData = this.renewableData;
  this.startYear = 1900;

  this.initVis();
};

RenewableVis.prototype.initVis = function () {
  var vis = this;

  vis.margin = { top: 10, right: 20, bottom: 50, left: 50 };

  vis.width = $("#co2-graph").width() - vis.margin.left - vis.margin.right;
  vis.height = 500 - vis.margin.top - vis.margin.bottom;

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left)
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

RenewableVis.prototype.wrangleData = function () {
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

RenewableVis.prototype.updateVis = function () {
  var vis = this;

  d3.select("#vis3-button")
    .text(
      "Energy production from low-carbon alternatives vs. fossil fuels"
    )
    .append("div")
    .attr("class", "arrow down");

  //Scales and axes
  vis.x = d3.scaleLinear().range([0, vis.width]);
  vis.y = d3.scaleLinear().range([vis.height, 0]);

  vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format("d"));
  vis.yAxis = d3.axisLeft().scale(vis.y).tickFormat(d3.format(".0%"));

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

  var minMaxY = [0, 1];

  vis.x.domain(minMaxX);
  vis.y.domain(minMaxY);

  //append axes to svg
  vis.svg
    .append("g")
    .attr("class", "x-axis axis")
    .attr("transform", "translate(0," + vis.height + ")");

  vis.svg.append("g").attr("class", "y-axis axis");

  //call axes
  vis.svg.selectAll(".tick").remove();

  vis.svg.select(".x-axis").call(vis.xAxis);

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
    .text("Percent");

  /* Referenced Thomas Cleary for Normalized Stack Area Chart: https://observablehq.com/@tcleary/normalized-stacked-area-chart*/
  // List of groups = header of the csv files
  var keys = Object.keys(vis.countryData[0]);

  // color palette
  var color = d3.scaleOrdinal().domain(keys).range([
    /*
      "#dddddd",
      */
    "#dd7c8a",
    "#7bb3d1",
    "#016eae",
    /*
      "#8d6c8f",
      "#4a4779",
      "#cc0024",
      "#8a274a",
      "#4b264d",
      */
  ]);

  //stack the data
  var stackedData = d3
    .stack()
    .keys([
      "electricity_renewables",
      "electricity_nuclear",
      "electricity_fossilfuels",
    ])
    .offset(d3.stackOffsetExpand)(vis.countryData);

  // Area generator
  var area = d3
    .area()
    .x(function (d) {
      return vis.x(d.data.year);
    })
    .y0(function (d) {
      return vis.y(d[0]);
    })
    .y1(function (d) {
      return vis.y(d[1]);
    });
    

  // Show the areas
  vis.svg
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
    .attr("class", function (d) {
      return "myArea " + d.key;
    })
    .style("fill", function (d) {
      return color(d.key);
    })
    .transition()
    .duration(2500)
    .attr("d", area);

    
  /* Y-Axis format style from Mike Bostock: https://observablehq.com/@d3/line-with-renewable_tooltip*/
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
    );

  //APPEND TOOLTIP
  /* Referenced from Mike Bostock: https://observablehq.com/@d3/line-with-renewable_tooltip*/
  vis.svg
    .on("pointerenter pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", (event) => event.preventDefault());

  var x = (d) => d.data.year;
  var y = (d) => Math.round((d[1] - d[0]) * 10000) / 100;
  var y1 = (d) => Math.round((d[1] - d[0]) * 10000) / 100;
  var y2 = (d) => Math.round((d[1] - d[0]) * 10000) / 100;

  const X = d3.map(stackedData[0], x);

  const Y = d3.map(stackedData[0], y);
  const Y1 = d3.map(stackedData[1], y1);
  const Y2 = d3.map(stackedData[2], y2);

  const O = d3.map(vis.countryData, (d) => d);

  // Compute titles
  var title = (i) =>
    `${X[i]}\n${"Fossil Fuels: " + Y[i] + "%"}\n${"Nuclear: " + Y1[i] + "%"}\n${
      "Renewables: " + Y2[i] + "%"
    }`;

  const renewable_tooltip = vis.svg
    .append("g")
    .style("pointer-events", "none")
    .attr("id", "renewable-tooltip");

  const tooltip_line = vis.svg
    .append("g")
    .style("pointer-events", "none")
    .attr("id", "tooltip-line");

  function pointermoved(event) {
    const i = d3.bisectCenter(X, vis.x.invert(d3.pointer(event)[0]));
    renewable_tooltip.style("display", null);
    tooltip_line.style("display", null);

    renewable_tooltip.attr(
      "transform",
      `translate(${vis.x(X[i])},${vis.height / 4})`
    );

    tooltip_line.attr(
      "transform",
      `translate(${vis.x(X[i])},${vis.height / 4})`
    );

    const path = renewable_tooltip
      .selectAll("path")
      .data([,])
      .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");

    const line = tooltip_line
      .selectAll(".tooltip-line")
      .data([,])
      .join("path")
      .attr("stroke", "black")
      .attr("class", "tooltip-line");

    const text = renewable_tooltip
      .selectAll("#renewable-tooltip text")
      .data([,])
      .join("text")
      .call((text) =>
        text
          .selectAll("tspan")
          .data(`${title(i)}`.split(/\n/))
          .join("tspan")
          .attr("x", 0)
          .attr("y", (_, i) => `${i * 18}px`)
          .attr("font-weight", (_, i) => (i ? null : "500"))
          .text((d) => d)
      );

    const circle = renewable_tooltip
      .selectAll("circle")
      .data(["#dd7c8a", "#7bb3d1", "#016eae"])
      .join("circle")
      .attr("r", 6)
      .attr("cx", 3)
      .attr("cy", (_, i) => `${i * 18 + 12}px`)
      .attr("fill", function (d) {
        return d;
      })
      .attr("transform", `translate(${30},${15})`);

    const { x, y, width: w, height: h } = text.node().getBBox();

    if (event.offsetX > vis.width - w - vis.margin.right - 20) {
      renewable_tooltip.attr(
        "transform",
        `translate(${vis.x(X[i]) - w - vis.margin.right - 20},${
          vis.height / 4
        })`
      );
    }

    text.attr("transform", `translate(${30},${15 - y})`);
    circle.attr("transform", `translate(${10},${15 - y})`);

    path.attr("d", `M${0},5H${w + 40}v${h + 20}h-${w + 40}z`);

    line
      .attr("transform", `translate(0,${-vis.height / 4})`)
      .attr("d", `M${0},0H${1}v${vis.height}h-${1}z`);

    vis.svg.property("value", O[i]).dispatch("input", { bubbles: true });
  }

  function pointerleft() {
    renewable_tooltip.style("display", "none");
    tooltip_line.style("display", "none");
    vis.svg.node().value = null;
    vis.svg.dispatch("input", { bubbles: true });
  }
};

RenewableVis.prototype.selectionChanged = function (currentCountry) {
  var vis = this;
  vis.currentCountry = currentCountry;
  // transition();
  vis.wrangleData();
};