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
    this.policyData = _data[1];
    this.gdpData = _data[2];
    this.iso_codeChange = _countryChange;
    this.timelineChange = _timelineChange;
    this.selectedCountry = "USA";
  
    this.date = 1990;
    this.initVis();
  };
  
  CO2Vis.prototype.initVis = function () {
    var vis = this;
  
    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };
  
    (vis.width =
      $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right),
      (vis.height = 600 - vis.margin.top - vis.margin.bottom);
  
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
    vis.co2Data = d3.group(vis.co2Data, (d) => d.iso_code);
    vis.policyData = d3.group(vis.policyData, (d) => d["Country ISO"]);
    vis.wrangleData();
  };
  
  CO2Vis.prototype.wrangleData = function () {
    var vis = this;
  
    //get data of current country
    var co2Data = vis.co2Data.get(
      this.selectedCountry /* replace later with actual selected country*/
    );
  
    var policyYearData = vis.policyData.get(
      this.selectedCountry /* replace later with actual selected country*/
    );
  
    //set title of graph
    d3.select("#co2_graph_title").text(
      co2Data[0].country +
        ": Percent of World's CO2 Output since 1990"
    );
  
    //get data from vis.date onwards
    co2Data = co2Data.filter(function (d) {
      return d.year >= vis.date;
    });
  
    /*
    policyYearData = policyYearData.filter(function (d) {
      return d["Date of decision"] >= vis.date;
    });
    //group policy data by year
    policyYearData = d3.group(policyYearData, (d) => d["Date of decision"]);
    policyYearData = Array.from(policyYearData, ([year, policies]) => ({
      year,
      policies,
    }));
    //refine co2Data to calculate percentages
    percentageco2Data = calculatePercentage(co2Data);
  */
  
    // Update the visualization
    vis.updateVis(co2Data);
  };
  
  //function to calculate percentage between years
  
  /*
  function calculatePercentage(co2Data) {
    var data = [];
    for (let i = 0; i < co2Data.length; i++) {
      if (i == 0) {
        data.push({
          country: co2Data[i].iso_code,
          year: co2Data[i].year,
          co2_percentage: 0,
          gdp_percentage: 0,
        });
      } else {
        var co2_difference, gdp_difference;
        if (co2Data[i].co2_per_capita == 0) {
          co2_difference = NaN;
        } else {
          co2_difference =
            (co2Data[i].co2_per_capita - co2Data[0].co2_per_capita) /
            co2Data[0].co2_per_capita;
        }
        //calculate percentage change in gdp/capita
        if (co2Data[i].gdp == 0) {
          gdp_difference = NaN;
        } else {
          gdp_difference = (co2Data[i].gdp - co2Data[0].gdp) / co2Data[0].gdp;
        }
        data.push({
          country: co2Data[i].iso_code,
          year: co2Data[i].year,
          co2_percentage: co2_difference,
          gdp_percentage: gdp_difference,
        });
      }
    }
    return data;
  }
  */
  
  CO2Vis.prototype.updateVis = function (co2Data) {
    var vis = this;
    // console.log(percentageco2Data);
    // Scales and axes
    vis.x = d3.scaleLinear().range([0, vis.width]);
    vis.y1 = d3.scaleLinear().range([vis.height, 0]);
    //vis.y2 = d3.scaleLinear().range([vis.height, 0]);
  
    vis.xBand = d3
      .scaleBand()
      .domain(co2Data.map((d) => d.year))
      .rangeRound([vis.margin.left, vis.width - vis.margin.right])
      .padding(0);
  
    vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format("d"));
    vis.yAxis1 = d3.axisLeft().scale(vis.y1).tickFormat(d3.format(".0%"));
    //vis.yAxis2 = d3.axisRight().scale(vis.y2);
  
    // Set domains
  
    var minMaxX = [
      d3.min(
        co2Data.map(function (d, i) {
          return d.year;
        })
      ),
      d3.max(
        co2Data.map(function (d, i) {
          return d.year + 2;
        })
      ),
    ];
    vis.x.domain(minMaxX);
  
    var minMaxY1 = [
      d3.min(
        co2Data.map(function (d, i) {
          var min = d3.min([d.co2_percentage, d.gdp_percentage]);
          return min - 0.1;
        })
      ),
      d3.max(
        co2Data.map(function (d, i) {
          var max = d3.max([d.co2_percentage, d.gdp_percentage]);
          return max + 0.1;
        })
      ),
    ];
    vis.y1.domain(minMaxY1);
  
    //get array of frequencies of policies from each year
    /*
    var minMaxY2 = [
      d3.min(policyYearData, function (d) {
        return d.policies.length;
      }),
      d3.max(policyYearData, function (d) {
        return d.policies.length + 10;
      }),
    ];
    vis.y2.domain(minMaxY2);
  */
  
    //append axes to svg
    vis.svg
      .append("g")
      .attr("class", "x-axis axis")
      .attr("transform", "translate(0," + vis.height + ")");
  
    vis.svg.append("g").attr("class", "y-axis1 axis");
  
    /*
    vis.svg
      .append("g")
      .attr("class", "y-axis2 axis")
      .attr("transform", "translate(" + vis.width + ",0)");
      */
  
    //call axes
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis1").call(vis.yAxis1);
    //vis.svg.select(".y-axis2").call(vis.yAxis2);
  
    //add axis labels
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
      .text("% Change");
  
      /*
    vis.svg
      .append("text")
      .attr("class", "y-axis2 label")
      .attr("x", 0)
      .attr("y", 0)
      .attr(
        "transform",
        "translate(" +
          (vis.width + vis.margin.right / 1.5) +
          "," +
          vis.height / 3 +
          ") rotate(90)"
      )
      .text("Number of Policies");
  */
  
  /*
    //add bar chart for policies
    let rectangles = vis.svg.selectAll("rect").data(policyYearData);
    //drawing bars
    rectangles
      .join("rect")
      .attr("x", function (d) {
        return vis.x(d.year);
      })
      .attr("width", vis.xBand.bandwidth())
      .attr("y", function (d) {
        return vis.y2(d.policies.length);
      })
      .attr("height", (d) => vis.height - vis.y2(d.policies.length))
      .attr("class", "bar");
      */
  
    //create line chart for GDP
    /*
    vis.svg
      .append("path")
      .datum(percentageco2Data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            if (!isNaN(d.gdp_percentage)) {
              return vis.x(d.year);
            }
          })
          .y(function (d) {
            if (!isNaN(d.gdp_percentage)) {
              return vis.y1(d.gdp_percentage);
            }
          })
      );
      */
  
    //create line chart for CO2
    vis.svg
      .append("path")
      .datum(co2Data)
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            if (!isNaN(d.co2_percentage)) {
              return vis.x(d.year);
            }
          })
          .y(function (d) {
            if (!isNaN(d.co2_percentage)) {
              return vis.y1(d.co2_percentage);
            }
          })
      );
  
    //add tooltip
    tip = d3
      .tip()
      .attr("class", "d3-tip")
      .direction("s")
      .offset(function () {
        return [0, 0];
      })
      .html(function (d) {
        var tooltip_data = {
          result: [
            {
              year: "1990",
              gdp: "23",
              co2: "24",
              policies: "4",
            },
          ],
        };
  
        return self.tooltip_render(tooltip_data);
      });
  
    //this.svg.call(tip);
  };
  
  CO2Vis.prototype.onCountryChange = function (currentCountry) {
    var vis = this;
  };
  
  /**
   * Renders the HTML content for tool tip
   *
   * @param tooltip_data information that needs to be populated in the tool tip
   * @return text HTML content for toop tip
   */
  
  CO2Vis.prototype.tooltip_render = function (tooltip_data) {
    var self = this;
  
    text = "hello world";
    /*
    text = "<p>"  + tooltip_data.srcElement.__data__.country + "</p>"
    console.log(tooltip_data.srcElement.__data__.country)
    */
  
    console.log("hovering over tooltip");
  
    return text;
  };