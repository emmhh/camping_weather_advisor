// // 这个文件里的内容没有使用。

// document.addEventListener("DOMContentLoaded", function () {
//   document.getElementById("getDataBtn").addEventListener("click", fetchData);
//   document
//     .getElementById("fetchApiDataBtn")
//     .addEventListener("click", fetchPublicApiData);
// });

// // New function to fetch data from the public APIs directory
// function fetchPublicApiData() {
//   d3.json("https://api.publicapis.org/entries")
//     .then(function (data) {
//       console.log("???");
//       // Assuming the data has an 'entries' array
//       const entries = data.entries.slice(0, 5); // Limit to 5 for demonstration
//       const displayElement = d3.select("#apiDataDisplay");
//       displayElement.html(""); // Clear previous results

//       entries.forEach((entry) => {
//         displayElement
//           .append("div")
//           .classed("api-entry", true)
//           .html(
//             `<strong>${entry.API}</strong> - ${entry.Description}<br>Auth: ${
//               entry.Auth || "None"
//             }<br>`
//           );
//       });
//     })
//     .catch((error) => {
//       console.error("Error fetching public API data:", error);
//       d3.select("#apiDataDisplay").text("Failed to load public API data");
//     });
// }

// function fetchData() {
//   d3.json(
//     "http://neo4j-api-env.eba-qrx2smw2.us-east-1.elasticbeanstalk.com/place_to_travel"
//   )
//     .then(renderDataWithD3)
//     .catch((error) => {
//       console.error("Error fetching data:", error);
//       d3.select("#dataDisplay").text("Failed to load data");
//     });
// }

// function renderDataWithD3(data) {
//   const displayElement = d3.select("#dataDisplay");
//   displayElement.html(""); // 清空以前的结果

//   data.forEach((item) => {
//     const dateString = `${item.forecastDate.year.low}-${item.forecastDate.month.low}-${item.forecastDate.day.low}`;
//     const locationString = `Best Location: ${item.BestLocation}`;
//     const sunriseTimeString = `Sunrise Time: ${item.SunriseTime.hour.low}:${item.SunriseTime.minute.low}:${item.SunriseTime.second.low}`;
//     const maxFavorableHoursString = `Max Favorable Hours: ${item.MaxFavorableHours.low}`;
//     const zipCodeString = `Zip Code: ${item.ZipCode}`;

//     // 使用D3创建卡片
//     const card = displayElement
//       .append("div")
//       .classed("card mb-3", true)
//       .style("max-width", "1500px");

//     const cardBody = card.append("div").classed("card-body", true);

//     cardBody.append("h5").classed("card-title", true).text(dateString);

//     cardBody
//       .append("p")
//       .classed("card-text", true)
//       .html(
//         `${locationString}<br>${sunriseTimeString}<br>${maxFavorableHoursString}<br>${zipCodeString}`
//       );

//     cardBody
//       .append("button")
//       .classed("btn btn-primary btn-sm", true)
//       .style("margin-right", "5px")
//       .text("Get Forecast");

//     cardBody
//       .append("button")
//       .classed("btn btn-primary btn-sm", true)
//       .text("Get Recommendation");
//   });
// }
