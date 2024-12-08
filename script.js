
d3.csv("updated_combined_data_with_russia.csv").then(data => {
  // Parse StabilityEstimate and ArmsDeliveries into numbers
  data.forEach(row => {
    row.StabilityEstimate = parseFloat(row.StabilityEstimate);
    row.ArmsDeliveries = parseFloat(row.ArmsDeliveries);
  });

  const width = 960;
  const height = 600;

  const colorScale = d3.scaleLinear()
    .domain([-3, -2, -1, 0, 1, 2, 3]) // Gradient stops
    .range(["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"]); // Colors

  const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("display", "none");

  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(geoData => {
    g.selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("d", d3.geoPath().projection(d3.geoMercator().scale(130).translate([width / 2, height / 1.5])))
      .attr("fill", d => {
        const countryData = data.find(row => row.Country === d.properties.name);
        return countryData && !isNaN(countryData.StabilityEstimate)
          ? colorScale(countryData.StabilityEstimate)
          : "#f0f0f0";
      })
      .attr("stroke", "#d3d3d3")
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block").text(d.properties.name);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .on("click", (event, d) => showCountryData(d.properties.name));
  });

  function showCountryData(country) {
    const countryData = data.filter(row => row.Country === country);

    if (countryData.length === 0) {
      alert("Data not available for " + country);
      return;
    }

    const years = countryData.map(row => +row.Year);
    const stability = countryData.map(row => +row.StabilityEstimate);
    const armsDeliveries = countryData.map(row => +row.ArmsDeliveries);

    // Arms Export Graph
    const armsTrace = {
      x: years,
      y: armsDeliveries,
      mode: "lines+markers",
      name: "Arms Export",
      line: { color: "#ff7f0e" }
    };

    const armsLayout = {
      title: `${country} - Arms Export Over Time`,
      xaxis: { title: "Year" },
      yaxis: { title: "Arms Export Value" }
    };

    // Stability Graph
    const stabilityTrace = {
      x: years,
      y: stability,
      mode: "lines+markers",
      name: "Political Stability",
      line: { color: "#1f77b4" }
    };

    const stabilityLayout = {
      title: `${country} - Political Stability Over Time`,
      xaxis: { title: "Year" },
      yaxis: { title: "Stability Level", range: [-3, 3] }
    };

    Plotly.newPlot("arms-chart", [armsTrace], armsLayout);
    Plotly.newPlot("stability-chart", [stabilityTrace], stabilityLayout);
  }

  function populateCountryDropdowns() {
    const countryList = [...new Set(data.map(row => row.Country))].sort();

    const country1Select = d3.select("#country1");
    const country2Select = d3.select("#country2");

    countryList.forEach(country => {
      country1Select.append("option").text(country).attr("value", country);
      country2Select.append("option").text(country).attr("value", country);
    });

    country1Select.property("value", "United States");
    country2Select.property("value", "Russia");

    updateComparisonCharts();
    country1Select.on("change", updateComparisonCharts);
    country2Select.on("change", updateComparisonCharts);
  }

  function updateComparisonCharts() {
    const country1 = d3.select("#country1").property("value");
    const country2 = d3.select("#country2").property("value");

    const country1Data = data.filter(row => row.Country === country1);
    const country2Data = data.filter(row => row.Country === country2);

    const years1 = country1Data.map(row => +row.Year);
    const stability1 = country1Data.map(row => +row.StabilityEstimate);
    const arms1 = country1Data.map(row => +row.ArmsDeliveries);

    const years2 = country2Data.map(row => +row.Year);
    const stability2 = country2Data.map(row => +row.StabilityEstimate);
    const arms2 = country2Data.map(row => +row.ArmsDeliveries);

    const armsTrace1 = { x: years1, y: arms1, mode: "lines+markers", name: country1 };
    const armsTrace2 = { x: years2, y: arms2, mode: "lines+markers", name: country2 };

    const stabilityTrace1 = { x: years1, y: stability1, mode: "lines+markers", name: country1 };
    const stabilityTrace2 = { x: years2, y: stability2, mode: "lines+markers", name: country2 };

    Plotly.newPlot("compare-arms-chart", [armsTrace1, armsTrace2], { title: "Arms Export Comparison" });
    Plotly.newPlot("compare-stability-chart", [stabilityTrace1, stabilityTrace2], { title: "Political Stability Comparison" });
  }

  populateCountryDropdowns();
}).catch(error => console.error("Error loading data:", error));
