/*
 * DecouplingVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: co2 data and gdp data
 * @param _countryChange		-- the actual data: event handler for country changing
 */

DecouplingVis = function (_parentElement, _data, _countryChange) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.gdpData = _data[0]
    this.co2Data = _data[1]
    this.countryChange = _countryChange;
    this.date = 1990;
    this.co2Countries = [];

    this.initVis();
}

DecouplingVis.prototype.initVis = function () {
    var vis = this;
    console.log(vis.data)

    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    //set title of graph
    d3.select("#co2_nd_title").text(
        "Worldwide History of Decoupling"
    );

    //group data by country name
    var i = 0
    vis.allCountries = []
    for (let i = 0; i < vis.co2Data.length; i++){
        if (!vis.allCountries.includes(vis.co2Data[i].iso_code)){
            vis.allCountries.push(vis.co2Data[i].iso_code)
        }
    }
    vis.co2Data = d3.group(vis.co2Data, (d) => d.iso_code);
    console.log(vis.allCountries)
    for (let i = 0; i < vis.co2Data.length; i++){
        console.log(vis.co2Data.iso_code)
    }

    vis.wrangleData()

}


//function to calculate percentage between years
function calculatePercentage(co2Data) {
  var data = [];
  console.log(co2Data)
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

      //calculate percentage change in co2/capita
      //* TO DO: Could not figure out how to NOT render line if NaN, replaced with 0 for now */
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



DecouplingVis.prototype.wrangleData = function () {
    var vis = this;

    var percentChangeByCountry = []
    for (let i = 0; i < vis.allCountries.length; i++){
        //get data of current country
        var co2Data = []
        if (vis.allCountries[i] != ""){
            co2Data = vis.co2Data.get(
                vis.allCountries[i] /* replace later with actual selected country*/
            );
            console.log(co2Data)
        }else{
            continue
        }

        // get data from vis.date onwards
        co2Data = co2Data.filter(function (d) {
            return d.year >= vis.date;
        });
        //percentageChanges
        percentageco2Data = calculatePercentage(co2Data);
        percentChangeByCountry.push(percentageco2Data)
    }

    vis.data = percentChangeByCountry


    vis.updateVis()


}

DecouplingVis.prototype.updateVis = function () {
    var vis = this;

    //scales and axes
    vis.x = d3.scaleLinear().range([0, vis.width]);
    vis.y = d3.scaleLinear().range([vis.height, 0]);

    vis.xAxis = d3.axisBottom().scale(vis.x).tickFormat(d3.format("d"));
    vis.yAxis = d3.axisLeft().scale(vis.y).tickFormat(d3.format("d"));

    // Set domains

    var minMaxX = [
        1990,
        2024,
    ];
    vis.x.domain(minMaxX);

    var minMaxY = [-75, 75]
      vis.y.domain(minMaxY);

    //draw the lines for the chart


    for (let i = 0; i < vis.data.length; i++) {
            vis.svg
                .append("path")
                .datum(vis.data[i])
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1)
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
                                return vis.y(d.gdp_percentage - d.co2_percentage);
                            }
                        })
                )
                .on("click", function(e, d){
                    $(vis.countryChange).trigger(
                        "selectionChanged",
                        d[0].country
                    );
                })
    }


    //append axes to svg
    vis.svg
        .append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g").attr("class", "y-axis axis");


    //call axes
    vis.svg.select(".x-axis").call(vis.xAxis);
    vis.svg.select(".y-axis").call(vis.yAxis);
}
