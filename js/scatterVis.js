/*
 * ScatterVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: co2 data and gdp data
 * @param _countryChange		-- the actual data: event handler for country changing
 */

ScatterVis = function (_parentElement, _data, _countryChange, _colors) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.co2Data = _data[0]
    this.popData = _data[1]
    this.countryChange = _countryChange;
    this.colors = _colors;

    this.initVis();
}

ScatterVis.prototype.initVis = function () {
    var vis = this;
    console.log(vis.data)

    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.wrangleData()

}


ScatterVis.prototype.countryNameConversion = function (country) {

    const conversions = new Map();
    conversions.set("United States of America", "United States");
    conversions.set("Russian Federation", "Russia");

    var newName = conversions.get(country)
    if (newName === undefined) {
        return country
    }
    return newName
}

ScatterVis.prototype.wrangleData = function () {
    var vis = this;

    var totalCo2Emissions2020 = 31.5 //billion tons 31,500,000,000
    var worldPopulation2020 = 7.837 //billion
    var co2Data = vis.co2Data
    var popData = vis.popData

    var co2Percentages = []
    var popPercentages = []
    //iterate through co2, then push emit/total-emit to arr

    for (let i = 0; i < co2Data.length; i++) {
        if (co2Data[i].year == 2020 && co2Data[i].co2 != 0) {
            co2Percentages.push({
                abbrev: co2Data[i].iso_code,
                //data in millions 4712.000 > 4,712,000,000
                percentage: ((co2Data[i].co2 * 1000000) / (totalCo2Emissions2020 * 1000000000)) * 100
            })
        }
    }

    //iterate through pop, then push pop/total-pop to arr

    for (let i = 0; i < popData.length; i++) {
        if (popData[i][2020] != 0) {
            popPercentages.push({
                abbrev: popData[i]["Country Code"],
                //data in million tons
                percentage: (popData[i][2020] / (worldPopulation2020 * 1000000000)) * 100,
                country: vis.countryNameConversion(popData[i]["Country Name"])
            })
        }

    }

    vis.co2Percentages = co2Percentages
    vis.popPercentages = popPercentages

    var ratios = []

    for (let i = 0; i < popPercentages.length; i++) {
        for (let j = 0; j < co2Percentages.length; j++) {
            if (popPercentages[i].abbrev == co2Percentages[j].abbrev) {
                ratios.push({
                    abbrev: popPercentages[i].abbrev,
                    ratio: (co2Percentages[j].percentage / popPercentages[i].percentage),
                    co2Perc: co2Percentages[j].percentage,
                    popPerc: popPercentages[i].percentage,
                    country: popPercentages[i].country
                })
            }
        }
    }

    vis.data = ratios

    vis.updateVis()

}



ScatterVis.prototype.countryStatus = function (country) {
    var vis = this;

    //geo data has slightly dif names. eg united states > united states of america
    var status = vis.data.find(x => x.abbrev == country)

    if (status === undefined) {
        return "white"
    }

    var colorScale = d3.scaleLinear()
        .domain([d3.min(
            vis.data.map(function (d, i) {
                return d.ratio;
            })
        ), 5])
        .range(["white", "red"])

    if (status.ratio > 5) {
        return "red"
    }

    return colorScale(status.ratio)
}

ScatterVis.prototype.updateVis = function () {
    var vis = this;

    //x-axis will be co2
    vis.minMaxX = [
        .00001,
        d3.max(
            vis.data.map(function (d, i) {
                return d.co2Perc;
            })
        )
    ]

    //y-axis will be risk index
    vis.minMaxY = [
        d3.min(
            vis.data.map(function (d, i) {
                return d.popPerc;
            })
        ),
        d3.max(
            vis.data.map(function (d, i) {
                return d.popPerc;
            })
        )
    ]

    //scales and axes
    vis.x = d3.scaleLog()
        .domain(vis.minMaxX)
        .range([0, vis.width])

    vis.svg.append("g")
        .attr("transform", "translate(0," + (vis.height) + ")")
        .call(d3.axisBottom(vis.x)
            .tickValues([vis.minMaxX[0], (vis.minMaxX[1] / 4), vis.minMaxX[1]])
            .tickFormat((d, i) => ['0%', '8%', "33%"][i]))

    vis.y = d3.scaleLog()
        .domain(vis.minMaxY)
        .range([vis.height, 0])

    vis.svg.append("g")
        .call(d3.axisLeft(vis.y)
            .tickValues([vis.minMaxY[0], (vis.minMaxY[1] / 4), (vis.minMaxY[1] / 4) * 2, (vis.minMaxY[1] / 4) * 3, vis.minMaxY[1]])
            .tickFormat((d, i) => ['0%', '5%', '9%', '13%', "19%"][i]))

    //axis labels
    vis.svg.append("text")
        .attr("class", "x-axis label")
        .attr("text-anchor", "end")
        .attr("x", vis.width / 2)
        .attr("y", vis.height + vis.margin.bottom / 1.5)
        .text("Percentage of CO2 Emissions");

    vis.svg.append("text")
        .attr("class", "y-axis1 label")
        .attr("x", 0)
        .attr("y", 0)
        .attr("transform", "translate(" + -vis.margin.left / 1.5 + "," + vis.height / 2 + ") rotate(-90)")
        .text("Percentage of Population");

    var tip = d3.tip().attr('class', 'd3-tip')
        .direction('s')
        .offset(function () {
            return [0, 0];
        })
        .html(function (d) {
            return vis.tooltip_render(d);
        });

    vis.svg.call(tip)

    //draw the circles for the chart
    vis.svg.append("g")
        .attr("id", "country-group")
        .selectAll("circle")
        .data(vis.data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return vis.x(d.co2Perc)
        })
        .attr("cy", function (d) {
            return vis.y(d.popPerc)
        })
        .attr("r", function (d) {
            return 5
        })
        .attr("stroke", "black")
        .attr("stroke-width", ".5px")
        .on("click", function (e, d) {
            var dAgain = d
            $(vis.countryChange).trigger(
                "selectionChanged",
                dAgain.abbrev
            );
            d3.select(".sidebar-header h3").text(d.country);
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .style("fill", function (e, d) {
            return vis.countryStatus(e.abbrev)
        })

}

/**
 * Renders the HTML content for tool tip
 *
 * @param tooltip_data information that needs to be populated in the tool tip
 * @return text HTML content for toop tip
 */
ScatterVis.prototype.tooltip_render = function (tooltip_data) {
    var self = this;

    var ratio = tooltip_data.srcElement.__data__.ratio

    if (isNaN(ratio)){
        text = "<div class='country-hover'>" + tooltip_data.srcElement.__data__.country + "<br/>" + "CO2/Population Ratio: Unavailable </div>"
    }
    else{
        text = "<div class='country-hover'>" + tooltip_data.srcElement.__data__.country + "<br/>" + "CO2/Population Ratio: " + Math.round((ratio + Number.EPSILON) * 100) / 100  + "</div>"
    }

    return text;
}

/**
 * Returns the ratio for a country
 *
 * @param country country for which the ratio needs to be found
 * @return returns proper ratio for country
 */
 ScatterVis.prototype.returnRatio = function (country) {
    var vis = this;

    for (let i = 0; i < vis.data.length; i++){
        if(vis.data[i].abbrev == country){
            return vis.data[i].ratio
        }
    }

    return "null";
}


ScatterVis.prototype.selectionChanged = function (country) {
    var vis = this

    var countries = vis.svg.selectAll("circle")

    countries.each(function(d){
        if (d.abbrev == country){
            d3.select(this).attr("stroke-width", "3")
        }else{
            d3.select(this).attr("stroke-width", ".5")
        }
    })
}