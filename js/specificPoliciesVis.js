/*
 * SpecificPoliciesVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: co2 data and gdp data
 * @param _countryChange		-- event handler for country changing
 * @param _timelineChange		-- event handler for timeline changing
 */

SpecificPoliciesVis = function (_parentElement, _data, _countryChange, _timelineChange) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.countryChange = _countryChange;
    this.timelineChange = _timelineChange;

    this.initVis();
}

SpecificPoliciesVis.prototype.initVis = function () {
    var vis = this;

    vis.margin = { top: 40, right: 0, bottom: 60, left: 60 };

    vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    // vis.svg = d3.select("#" + vis.parentElement).append("svg")
    //     .attr("width", vis.width + vis.margin.left + vis.margin.right)
    //     .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    //     .append("g")
    //     .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
    vis.wrangleData();
}

SpecificPoliciesVis.prototype.wrangleData = function () {
    var vis = this;
    vis.colors = [];
    var policyHtmls = $( ".policy_bar" );
    for (var i=0; i<policyHtmls.length; i++) {
        vis.colors.push({"policy_type": policyHtmls[i].id, "color":policyHtmls[i].style.fill});
    }
    
    d3.select("#specific_policies_vis_title").text(
          "Climate Policies"
      );

    console.log(vis.colors);
    vis.updateVis();
  
};

SpecificPoliciesVis.prototype.updateVis = function () {
    var vis = this;
    // Todo: use bootstrap carousel to improve interactive effects
    for (let i=0; i<vis.data.length; i++) {
        let policy_name = vis.data[i]['Policy name'];
        let policy_year = vis.data[i]['Date of decision'];
        let policy_types = vis.data[i]['Policy type'].split(",");
        
        var title = document.createElement("h5");
        title.className = "card-title";
        title.innerHTML = policy_name.slice(0, policy_name.length-6);          
        
        var subtitle = document.createElement("h6");
        subtitle.className = "card-subtitle mb-2 text-muted";
        subtitle.innerHTML = policy_year;
        
        var card = document.createElement("div");
        card.className = "card card"+i;
       
        var card_body = document.createElement("div");
        card_body.className = "card-body";
        card_body.append(title, subtitle);

        for (var k=0; k<policy_types.length; k++) {
            var policy_type = document.createElement("a");
            policy_type.className = "btn btn-primary";
            policy_type.innerHTML = policy_types[k];
            policy_type.style.backgroundColor = policyBackgroundColor(policy_types[k], vis.colors)
            
            card_body.append(policy_type);
        }

        card.append(card_body);

        var carousel_item = document.createElement("div");
        carousel_item.className = "carousel-item";
        carousel_item.append(card);

        $(".carousel-inner").append(carousel_item);
    }
};

function policyBackgroundColor(policy_type, colors) {
    for (var i=0; i<colors.length; i++) {
        if (colors[i].policy_type == policy_type){
            return colors[i].color;
        }
    }
    return "black";
}


