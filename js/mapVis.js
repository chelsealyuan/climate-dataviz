/*
 * MapVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: not quite sure yet
 * @param _countryChange		-- the actual data: event handler for country changing
 */


MapVis = function (_parentElement, _data, _countryChange, _scatterVis, _colors) {
    this.parentElement = _parentElement;
    this.data = _data
    this.countryChange = _countryChange;
    this.scatterVis = _scatterVis;
    this.colors = _colors;

    this.initVis();
}

MapVis.prototype.initVis = function () {
    var vis = this;

    vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    vis.height = 500 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        // .style("background-color", "#ededed")
        .append("g")
        .attr("transform", "translate(-" + vis.margin.left + "," + vis.margin.top + ")");

    var projection = d3.geoMercator()
        .center([0, 0])
        .scale(130)
        .rotate([-180, 0])

    var path = d3.geoPath()
        .projection(projection);

    var g = vis.svg.append("g")
        .attr("transform", "translate(-" + vis.margin.left + "," + vis.margin.top + ")")
        .attr("fill", "black");

    var topology = vis.data[0]

    var tip = d3.tip().attr('class', 'd3-tip')
        .direction('s')
        .offset(function () {
            return [0, 0];
        })
        .html(function (d) {
            return vis.tooltip_render(d);
        });

    vis.svg.call(tip)

    //draw all countries
    g.selectAll("path")
        .data(vis.data[0].features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "black")
        .attr("stroke-width", .3)
        .attr("id", function(e, d){
            return e.properties.adm0_iso
        })
        .style("fill", function (e, d) {
            //vulnerable, emitter, or both
            return vis.scatterVis.countryStatus(e.properties.adm0_iso)
        })
        .on("click", function (e, d) {
            $(vis.countryChange).trigger("selectionChanged", d.properties.adm0_iso);
            d3.select(".sidebar-header h3").text(d.properties.name);
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', function (event) {
            g.attr('transform', event.transform);
        });

    var drag = d3.drag().on('drag', (event) => {
        const rotate = projection.rotate()
        const k = 75 / projection.scale()
        projection.rotate([rotate[0] + event.dx * k])
        path = d3.geoPath().projection(projection)
        vis.svg.selectAll("path").attr("d", path)
    })

    vis.svg.call(drag)
    vis.svg.call(zoom)


    var colors = [ "white", "red"];

    var grad = vis.svg.append('defs')
        .append('linearGradient')
        .attr('id', 'grad')
        .attr('x1', '0%')
        .attr('x2', '0%')
        .attr('y1', '0%')
        .attr('y2', '100%');

    grad.selectAll('stop')
        .data(colors)
        .enter()
        .append('stop')
        .style('stop-color', function(d){ return d; })
        .attr('offset', function(d,i){
            return 100 * (i / (colors.length - 1)) + '%';
        })

    var anchorX = 800
    var anchorY = 300
    vis.svg.append("rect")
        .attr("height", 150)
        .attr("width", 75)
        .attr("x", anchorX - 10)
        .attr("y", anchorY - 25)
        .attr("fill", "#e5e5e5")

    vis.svg.append('rect')
        .attr('x', anchorX)
        .attr('y', anchorY)
        .attr('width', 30)
        .attr('height', 100)
        .style('fill', 'url(#grad)');

    vis.svg.append("text")
        .text("0X")
        .attr("x", anchorX + 35)
        .attr("y", anchorY + 10)

    vis.svg.append("text")
        .text("5X +")
        .attr("x", anchorX + 35)
        .attr("y", anchorY + 105)

}

/**
 * Renders the HTML content for tool tip
 *
 * @param tooltip_data information that needs to be populated in the tool tip
 * @return text HTML content for toop tip
 */
MapVis.prototype.tooltip_render = function (tooltip_data) {
    var vis = this;

    var ratio = vis.scatterVis.returnRatio(tooltip_data.srcElement.__data__.properties.adm0_iso)
    console.log(ratio)
    if (isNaN(ratio)){
        text = "<div class='country-hover'>" + tooltip_data.srcElement.__data__.properties.name + "<br/>" + "CO2/Population Ratio: Unavailable </div>"
    }
    else{
        text = "<div class='country-hover'>" + tooltip_data.srcElement.__data__.properties.name + "<br/>" + "CO2/Population Ratio: " + Math.round((ratio + Number.EPSILON) * 100) / 100  + "</div>"
    }

    return text;
}


/**
 * Return the ratio's corresponding color
 *
 * @param countryCode country whose color is needed
 * @return color of country
 */
MapVis.prototype.colorForResponsibility = function (countryCode) {
    var self = this;
    var co2Data = vis.data[1]
    var popData = vis.data[2]
    var ratios = []


    for (let i = 0; i < popData.length; i++) {
        for (let j = 0; j < co2Data.length; j++) {
            if (popData[i].abbrev == co2Data.abbrev) {
                ratios.push({
                    abbrev: popData[i].abbrev,
                    ratio: co2Data[i].percent / popData[i].percent
                })
            }
        }
    }

    return text;
}


MapVis.prototype.selectionChanged = function (country) {
    var vis = this

    var countries = vis.svg.select("g").selectAll("path")

    countries.each(function(d){
        if (d.properties.adm0_iso == country){
            d3.select(this).attr("stroke-width", "3")
        }else{
            d3.select(this).attr("stroke-width", ".3")
        }
    })
}


