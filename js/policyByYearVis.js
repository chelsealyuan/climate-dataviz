/*
 * PolicyTypesVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: co2 data and gdp data
 * @param _countryChange		-- event handler for country changing
 * @param _timelineChange		-- event handler for timeline changing
 */

PolicyByYearVis = function (
  _parentElement,
  _data,
  _countryChange,
  _yearChange,
  _timelineChange
) {
  this.parentElement = _parentElement;
  this.rawdata = _data;
  this.filteredData = this.rawdata;
  this._countryChange = _countryChange;
  this.policy_year = _yearChange;
  this.timelineChange = _timelineChange;
  this.initVis();
};

PolicyByYearVis.prototype.initVis = function () {
  var vis = this;

  vis.margin = { top: 10, right: 20, bottom: 60, left: 50 };

  (vis.width = $("#co2-graph").width() - vis.margin.left - vis.margin.right),
    (vis.height = 400 - vis.margin.top - vis.margin.bottom);

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    );

  //group data by country name
  vis.filteredData = d3.group(vis.filteredData, (d) => d["Country ISO"]);

  //set default country
  vis.currentCountry = "USA";

  vis.wrangleData();
};

PolicyByYearVis.prototype.wrangleData = function () {
  var vis = this;
  vis.tags = [];
  vis.counts = [];

  vis.data = [];
  vis.countryData = vis.filteredData.get(vis.currentCountry);
  for (var i = 1954; i < 2023; i++) {
    vis.data.push({ year: i, count: 0 });
  }
  vis.countryData.forEach(function (data) {
    data["Date of decision"] = +data["Date of decision"];
    upd_obj_idx = vis.data.findIndex(
      (obj) => obj.year == data["Date of decision"]
    );
    vis.data[upd_obj_idx].count += parseInt(1);
  });
  vis.data = vis.data.sort(function (a, b) {
    return a.year - b.year;
  });

  vis.updateVis();
};

PolicyByYearVis.prototype.updateVis = function () {
  var vis = this;

  d3.select("#vis4-button")
    .text("Establishing Climate Policies & Types of Policies")
    .append("div")
    .attr("class", "arrow down");

  // Scales
  vis.x = d3.scaleLinear().range([0, vis.width]);
  vis.y = d3.scaleLinear().range([vis.height, 0]);

  // Axes
  vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format("d"));
  vis.yAxis = d3.axisLeft().scale(vis.y);

  // Set domains
  var minMaxY = [0, 55];
  vis.y.domain(minMaxY);

  var minMaxX = [vis.data[0].year, vis.data[67].year + 3];
  vis.x.domain(minMaxX);

  //add bar chart for policy types
  let padding = 7;
  let rectangles = vis.svg.selectAll("rect").data(vis.data);

  //drawing bars
  rectangles
    .join("rect")
    .attr("y", function (d) {
      return vis.y(d.count);
    })
    .attr("height", function (d) {
      return 330 - vis.y(d.count);
    })
    .attr("x", function (d) {
      return vis.x(d.year);
    })
    .attr("width", padding)
    .attr("class", "bar policy_bar")
    .attr("id", function (d) {
      return d.year;
    })
    .style("fill", "#016eae")
    .on("click", function (d) {
      $("span.policy_year").text($(this)[0].id);
      $("span.policy_year").attr("id", $(this)[0].id);
      $(vis.policy_year).trigger("yearChanged", $(this)[0].id);
    });

  /* Y-Axis format style from Mike Bostock: https://observablehq.com/@d3/line-with-co2_tooltip*/
  vis.svg.selectAll(".tick").remove();

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

  vis.svg
    .append("g")
    .attr("class", "x-axis axis")
    .attr("transform", "translate(0," + vis.height + ")");

  vis.svg.append("g").attr("class", "y-axis axis");

  //call axes
  vis.svg.select(".x-axis").call(vis.xAxis);

  //add axis labels
  vis.svg.selectAll(".label").remove();

  vis.svg
    .append("text")
    .attr("class", "x-axis label")
    .attr("text-anchor", "end")
    .attr("x", vis.width / 2)
    .attr("y", vis.height + vis.margin.bottom / 1.5)
    .text("Year");

  vis.svg
    .append("text")
    .attr("class", "y-axis1 label")
    .attr("x", 0)
    .attr("y", 0)
    .attr(
      "transform",
      "translate(" +
        -vis.margin.left / 1.5 +
        "," +
        vis.height / 2 +
        ") rotate(-90)"
    )
    .text("Number of Policies");

  //APPEND TOOLTIP
  /* Referenced from Mike Bostock: https://observablehq.com/@d3/line-with-co2_tooltip*/
  vis.svg
    .on("pointerenter pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", (event) => event.preventDefault());

  var x = (d) => d.year;
  var y = (d) => d.count;

  const X = d3.map(vis.data, x);
  const Y = d3.map(vis.data, y);
  const O = d3.map(vis.data, (d) => d);

  // Compute titles
  var title = (i) => `${X[i]}\n${Y[i] + " new policies"}`;

  const co2_tooltip = vis.svg
    .append("g")
    .style("pointer-events", "none")
    .attr("id", "pol-tooltip");

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

PolicyByYearVis.prototype.selectionChanged = function (currentCountry) {
  var vis = this;
  vis.currentCountry = currentCountry;
  vis.wrangleData();
};
