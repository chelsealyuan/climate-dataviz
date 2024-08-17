/*
 * PolicyTypesVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: co2 data and gdp data
 * @param _countryChange		-- event handler for country changing
 * @param _timelineChange		-- event handler for timeline changing
  */

PolicyTypesVis = function (_parentElement, _data, _countryChange, _yearChange, _timelineChange) {
    this.parentElement = _parentElement;
    this.rawdata = _data;
    this.filteredData = this.rawdata;
    this._countryChange = _countryChange;
    this.timelineChange = _timelineChange;
    this.policy_year = _yearChange;
    this.colors = ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];


    this.initVis();
}

PolicyTypesVis.prototype.initVis = function () {
    var vis = this;

    vis.margin = { top: 40, right: 60, bottom: 60, left: 60 };

    vis.width = $("#co2-graph").width() - vis.margin.left - vis.margin.right,
        vis.height = 400 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3
        .select("#" + vis.parentElement)
        .append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    //group data by country name
    vis.filteredData = d3.group(vis.filteredData, (d) => d['Country ISO']);
 
    //set default country
    vis.currentCountry = "USA";

    vis.wrangleData();

}

PolicyTypesVis.prototype.wrangleData = function () {
    var vis = this;
    vis.policy_year = $("span.policy_year");
    vis.tags = [];
    vis.counts = [];
    vis.data = [];
    vis.countryData = vis.filteredData.get(vis.currentCountry);

    if ($("span.policy_year")[0].id > 1950) {
        vis.countryData = vis.countryData.filter(item => item['Date of decision'] == $("span.policy_year")[0].id);
    }

    vis.countryData.forEach(function (data) {
        data["Date of decision"] = +data["Date of decision"];

        // split types by comma, notice that do not split by and
        var types = data["Policy type"].split(",");

        // count the number of each policy type
        for (var j = 0; j < types.length; j++) {
            upd_obj_idx = vis.data.findIndex((obj) => obj.policy_type == types[j]);
            if (upd_obj_idx >= 0) {
                vis.data[upd_obj_idx].count += parseInt(1);
            } else {
                vis.data.push({ policy_type: types[j], count: 1 });
            }
        }
    });
    
    vis.data = vis.data
        .sort(function (a, b) {
        return b.count - a.count;
        });

    
    var others_count = 0;
    if (vis.data.length>4) {
        for (var i=4; i<vis.data.length; i++) {
            others_count += vis.data[i].count;
        }
        
        vis.data = vis.data.slice(0,4);
        vis.total_num_of_policies = 0;
        for (var i=0; i<vis.data.length; i++) {
            vis.tags.push(vis.data[i].policy_type);
            vis.counts.push(vis.data[i].count);
            vis.total_num_of_policies += vis.data[i].count;
        }
        vis.tags.push("Others");
        vis.counts.push(others_count);
        vis.data.push({ policy_type: "Others", count: others_count });
    }

    vis.updateVis();
  
};

// cite for drawing pie chart: https://www.tutorialsteacher.com/d3js/create-pie-chart-using-d3js
PolicyTypesVis.prototype.updateVis = function () {
    var vis = this;
    vis.svg.data(vis.data);
    var tip = d3.tip().attr('class', 'd3-tip')
    .attr("x", 0)
    .attr("y", 0)
    .direction('s')
    .style("top",0)
    .style("left",0)
    .offset(function () {
        return [0, 0];
    })
    .html(function (d) {
        return vis.tooltip_render(d, vis.tags);
    });

    vis.svg.call(tip)
    d3.select("#vis2-button")
        .text("What are the top 5 most frequent climate policy types?")
        .append("div")
        .attr("class", "arrow down")

        radius = Math.min(vis.width*1.2, vis.height*1.2) / 2,
        g = vis.svg.append("g").attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");
    
        var color = d3.scaleOrdinal(["#016eae", "#7bb3d1", "#dd7c8a",'#984ea3','#7bb31c']);
    
        // Generate the pie
        var pie = d3.pie();
    
        // Generate the arcs
        var arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(radius*0.66);
    
        //Generate groups
        var arcs = g.selectAll("arc")
                    .data(pie(vis.counts))
                    .enter()
                    .append("g")
                    .attr("class", function(d, i) {
                        return "arc arc_"+i;
                    })
                    .attr("id", function(d, i) {
                        return i;
                    })
                    .on("mouseover", tip.show)
                    .on("mouseout", tip.hide);
    
        //Draw arc paths
        arcs.append("path")
            .attr("fill", function(d, i) {
                return color(i);
            })
            .attr("d", arc);
            

        // append percentage
        var label = d3.arc()
            .outerRadius(radius-10)
            .innerRadius(radius-60);
            
        arcs.append("text")
        .attr("transform", function(d) { 
            return "translate(" + label.centroid(d) + ")"; 
        })
        .data(vis.counts)
        .text(function(d) { return d; });

};

PolicyTypesVis.prototype.selectionChanged = function (currentCountry) {
    var vis = this;
    vis.currentCountry = currentCountry;
    vis.wrangleData();
};

PolicyTypesVis.prototype.yearChanged = function (currentYear) {
    var vis = this;
    vis.policy_year = currentYear;
    vis.wrangleData();
};


/**
 * Renders the HTML content for tool tip
 *
 * @param tooltip_data information that needs to be populated in the tool tip
 * @return text HTML content for toop tip
 */
 PolicyTypesVis.prototype.tooltip_render = function (tooltip_data, labels) {
    var self = this;
    var idx = tooltip_data.srcElement.__data__.index;
    text = "<h4 style=width:200px><b>" + labels[idx] + "</b></h4>";
    $("#policy_type_text").html(text);
}