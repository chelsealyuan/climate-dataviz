// Load data asynchronously


document.getElementById("label1").style.backgroundColor = "#ffb3b3";

var files = [
  "data/co2-data.csv",
  "data/climate-policy-data.csv",
  "data/custom.geo.json",
  "data/elec-fossil-nuclear-renewables.csv",
  "data/country-pop-data.csv"
];
var promises = [];

files.forEach(function (url, i) {
  if (i == 2) {
    promises.push(d3.json(url));
  } else {
    promises.push(d3.csv(url));
  }
});

Promise.all(promises).then(function (values) {
  console.log(values)
  createVis(values[0], values[1], values[2], values[3], values[4]);
});

function createVis(co2, pol, map, renewable, pop) {
  //CLEANING DATA TYPES
  //cleaning data types for co2 data
  co2.forEach(function (data) {
    data.co2 = +data.co2;
    data.co2_per_capita = +data.co2_per_capita;
    data.cumulative_co2 = +data.cumulative_co2;
    data.population = +data.population;
    data.year = +data.year;
  });

  //countries not in the map shouldn't be in the scatter plot
  var co2 = co2.filter(co2Record => {
    for (let i = 0; i < map.features.length; i++){
      if (map.features[i].properties.adm0_iso == co2Record.iso_code){
        return true
      }
    }
    return false

  })

  //cleaning data types for renewables data
  renewable.forEach(function (data) {
    data.year = +data.year;
    data.electricity_fossilfuels = +data.electricity_fossilfuels;
    data.electricity_nuclear = +data.electricity_nuclear;
    data.electricity_renewables = +data.electricity_renewables;
  });

  //cleaning data types for policy data
  var start_year = 1900;
  var end_year = 2022;
  pol = pol.filter(
    (item) =>
      item["Date of decision"] >= start_year &&
      item["Date of decision"] <= end_year
  );

  //event handlers for changing country and changing brush
  var countryChangeEventHandler = {};
  var policyYearChangeEventHandler = {};
  var countryTimelineChangeEventHandler = {};

  var primaryColors = ["#dddddd", "#7bb3d1", "#016eae", "#dd7c8a", "#8d6c8f", "#4a4779", "#cc0024", "#8a274a", "#4b264d"]

  var co2Vis = new CO2Vis(
    "co2-graph",
    [co2],
    countryChangeEventHandler,
    countryTimelineChangeEventHandler
  );

  var renewableVis = new RenewableVis(
    "renewable-graph",
    [renewable],
    countryChangeEventHandler,
    countryTimelineChangeEventHandler
  );

  var policyByYearVis = new PolicyByYearVis(
    "policy_by_year_chart",
    pol,
    countryChangeEventHandler,
    policyYearChangeEventHandler,
    countryTimelineChangeEventHandler
  );
  var policyTypesVis = new PolicyTypesVis(
    "policy_types_chart",
    pol,
    countryChangeEventHandler,
    policyYearChangeEventHandler,
    countryTimelineChangeEventHandler
  );

  var scatterVis = new ScatterVis(
    "scatter-vis",
    [co2, pop],
    countryChangeEventHandler,
    primaryColors
  );

  //hide scatter vis by default
  $("#scatter-vis-container").hide();

  var mapVis = new MapVis(
    "map-vis",
    [map, co2, pop],
    countryChangeEventHandler,
    scatterVis,
    primaryColors
  );

  $(countryChangeEventHandler).bind(
    "selectionChanged",
    function (event, selectedCountry) {
      mapVis.selectionChanged(selectedCountry)
      scatterVis.selectionChanged(selectedCountry)
      co2Vis.selectionChanged(selectedCountry);
      renewableVis.selectionChanged(selectedCountry);
      policyByYearVis.selectionChanged(selectedCountry);
      policyTypesVis.selectionChanged(selectedCountry);
    }
  );

  $(policyYearChangeEventHandler).bind(
    "yearChanged",
    function (event, selectedYear) {
      policyTypesVis.yearChanged(selectedYear);
    }
  );
  
  

}

//Selectors for type of vis
function switchVis(visName) {
  var visContainers = document.getElementsByClassName("main-vis");

  for (let i = 0; i < visContainers.length; i++) {
    visContainers[i].style.display = "none";
  }
  document.getElementById(visName).style.display = "block";

  if(visName == "map-vis-container"){
    document.getElementById("label1").style.backgroundColor = "#ffb3b3";
    document.getElementById("label2").style.backgroundColor = "white";  
  }
  else{
    document.getElementById("label1").style.backgroundColor = "white";
    document.getElementById("label2").style.backgroundColor = "#ffb3b3";  
  }

}
