// 1. SVG Setup
// 1.1. Main SVG container
const svg = d3.select("#heatmap").attr("width", 700).attr("height", 500);

// 1.2. Margins and the area where the heatmap will be drawn
const margin = { top: 70, right: 20, bottom: 20, left: 100 };
const width = 700 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// 1.3. Group for all heatmap elements
const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

let colorDomain;

// 2. Heatmap Draw Function
// First prepares data (counts number of accidents per day and hour)
// and then it draws the heatmap
function drawHeatmap(data, days, hours) {
  // 2.1. Remove previous heatmap elements
  g.selectAll("*").remove();
  svg.select("#heatmap-legend").remove();
  svg.select("defs").remove();

  // 2.2. Count Accidents for each day and hour and then store it
  // in the array heatmapData
  const countMap = {};
  data.forEach((d) => {
    const key = d.Day_of_Week + "_" + d.Hour;
    countMap[key] = (countMap[key] || 0) + 1;
  });

  const heatmapData = [];
  days.forEach((day) => {
    hours.forEach((hour) => {
      heatmapData.push({
        day: day,
        hour: hour,
        value: countMap[day + "_" + hour] || 0,
      });
    });
  });

  // 2.3. Scales for the grid layout and color mapping
  const x = d3.scaleBand().domain(hours).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(days).range([0, height]).padding(0.05);
  const color = d3
    .scaleSequential()
    .domain([colorDomain[1], colorDomain[0]])
    .interpolator(d3.interpolateRdYlGn);

  // 2.4. Draw legend

  const legendWidth = 20;
  const legendHeight = 200;

  const legend = svg
    .append("g")
    .attr("id", "heatmap-legend")
    .attr(
      "transform",
      `translate(${margin.left + width + 100}, ${margin.top})`
    );

  const defs = svg.append("defs");
  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  linearGradient
    .selectAll("stop")
    .data(d3.range(0, 1.01, 0.1))
    .enter()
    .append("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => d3.interpolateRdYlGn(d));

  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)")
    .style("stroke", "black");

  const legendScale = d3
    .scaleLinear()
    .domain([colorDomain[1], colorDomain[0]])
    .range([legendHeight, 0]);

  const legendAxis = d3
    .axisRight(legendScale)
    .ticks(5)
    .tickFormat(d3.format("d"));

  legend
    .append("g")
    .attr("transform", `translate(${legendWidth + 20},0)`)
    .call(legendAxis);

  legend
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", legendHeight + 30)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "12px")
    .text("Number of Accidents");

  // 2.5. Bind aggregated number of accidents to rects
  const rects = g
    .selectAll("rect")
    .data(heatmapData, (d) => d.day + "_" + d.hour);

  rects
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.hour))
    .attr("y", (d) => y(d.day))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", color(colorDomain[0]))
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px")
        .html(
          `<strong>Day:</strong> ${d.day}<br>
         <strong>Hour:</strong> ${d.hour}<br>
         <strong>Accidents:</strong> ${d.value}`
        );
      d3.select(this).style("stroke", "white").style("stroke-width", 2);
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
      d3.select(this).style("stroke", null).style("stroke-width", null);
    })
    .merge(rects)
    .transition()
    .duration(1200)
    .attr("fill", (d) => color(d.value));

  rects.exit().remove();

  // 2.6. Draw axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));
}

// 3. Add static labels (x-axis, y-axis labels and title)
svg
  .append("text")
  .attr("class", "axis-label")
  .attr("x", margin.left + width / 2)
  .attr("y", margin.top + height + 40)
  .attr("text-anchor", "middle")
  .attr("fill", "white")
  .attr("font-size", "18px")
  .text("Hour of Day");

svg
  .append("text")
  .attr("class", "axis-label")
  .attr("transform", `rotate(-90)`)
  .attr("x", -(margin.top + height / 2))
  .attr("y", margin.left - 70)
  .attr("text-anchor", "middle")
  .attr("fill", "white")
  .attr("font-size", "18px")
  .text("Day of Week");

svg
  .append("text")
  .attr("x", 350)
  .attr("y", margin.top / 2)
  .attr("text-anchor", "middle")
  .attr("font-size", "20px")
  .attr("font-weight", "bold")
  .attr("fill", "white")
  .text("Number of Road Accidents per Hour and Weekday");

// 4. Data Loading
d3.csv("road_data.csv").then((data) => {
  console.log(data);

  function getSeason(date) {
    const month = date.getMonth() + 1; // 1–12

    if (month === 12 || month <= 2) return "Winter";
    if (month <= 5) return "Spring";
    if (month <= 8) return "Summer";
    return "Fall";
  }

  // Variables Hour and Season
  data.forEach((d) => {
    d.Accident_Date = new Date(d["Accident Date"]);
    d.Season = getSeason(d.Accident_Date);
    if (d.Time) {
      d.Hour = d.Time.split(":")[0].padStart(2, "0");
    }
  });

  // Remove rows with missing weekday or hour information
  data = data.filter((d) => d.Day_of_Week && d.Hour);

  const allDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const hours = Array.from(new Set(data.map((d) => d.Hour))).sort();

  let selectedDays = allDays.slice();
  let selectedHours = hours.slice();

  // Global color domain
  const countMapFull = {};
  data.forEach((d) => {
    const key = d.Day_of_Week + "_" + d.Hour;
    countMapFull[key] = (countMapFull[key] || 0) + 1;
  });
  const allHeatmapData = [];
  allDays.forEach((day) => {
    hours.forEach((hour) => {
      allHeatmapData.push({
        day: day,
        hour: hour,
        value: countMapFull[day + "_" + hour] || 0,
      });
    });
  });
  colorDomain = d3.extent(allHeatmapData, (d) => d.value);

  drawHeatmap(data, allDays, hours);

  // Filtering
  // By day
  const daySelect = document.getElementById("daySelect");
  if (daySelect) {
    daySelect.addEventListener("change", function () {
      const values = Array.from(this.selectedOptions).map((opt) => opt.value);
      if (values.includes("__all__")) {
        Array.from(daySelect.options).forEach((opt) => {
          if (opt.value !== "__all__") opt.selected = true;
        });
        selectedDays = allDays.slice();
      } else {
        selectedDays = values;
      }
      updateHeatmap();
    });
  }

  //By hour
  const hourSelect = document.getElementById("hourSelect");
  if (hourSelect) {
    hourSelect.addEventListener("change", function () {
      const values = Array.from(this.selectedOptions).map((opt) => opt.value);
      if (values.includes("__all__")) {
        Array.from(hourSelect.options).forEach((opt) => {
          if (opt.value !== "__all__") opt.selected = true;
        });
        selectedHours = hours.slice();
      } else {
        selectedHours = values;
      }
      updateHeatmap();
    });
  }

  // by severity
  const severityFilter = document.getElementById("severityFilter");
  let selectedSeverity = "__all__";

  if (severityFilter) {
    severityFilter.addEventListener("change", function () {
      selectedSeverity = this.value;
      updateHeatmap();
    });
  }

  // by season
  const seasonFilter = document.getElementById("seasonFilter");
  let selectedSeason = "__all__";
  if (seasonFilter) {
    seasonFilter.addEventListener("change", function () {
      selectedSeason = this.value;
      updateHeatmap();
    });
  }

  // A function that updates the Heatmap when the filter is changed
  function updateHeatmap() {
    let filtered = data;
    if (selectedDays.length) {
      filtered = filtered.filter((d) => selectedDays.includes(d.Day_of_Week));
    }
    if (selectedHours.length) {
      filtered = filtered.filter((d) => selectedHours.includes(d.Hour));
    }
    if (selectedSeverity !== "__all__") {
      filtered = filtered.filter(
        (d) => d.Accident_Severity == selectedSeverity
      );
    }
    if (selectedSeason !== "__all__") {
      filtered = filtered.filter((d) => d.Season == selectedSeason);
    }

    const tmpCountMap = {};
    filtered.forEach((d) => {
      const key = d.Day_of_Week + "_" + d.Hour;
      tmpCountMap[key] = (tmpCountMap[key] || 0) + 1;
    });

    const tmpValues = Object.values(tmpCountMap);

    colorDomain = d3.extent(tmpValues);

    drawHeatmap(
      filtered,
      selectedDays.length ? selectedDays : allDays,
      selectedHours.length ? selectedHours : hours
    );
  }
});
