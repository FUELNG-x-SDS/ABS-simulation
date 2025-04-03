var WINDOWBORDERSIZE = 0;
var HUGE = 999999; // Sometimes useful when testing for big or small numbers
var animationDelay = 250; // Controls simulation and transition speed
var isRunning = false; // Used to start/end animation (in simStep and toggleSimStep)
var surface; // Set in the redrawWindow function (D3 selection of the svg drawing surface)
var simTimer; // Set in the initialization function

// Drawing surface will be divided into logical cells
var maxCols = 11;
var maxRows = 5;
var cellWidth; // Calculated in redrawWindow function
var cellHeight;

// Icons initialisation
const iconContainerForward = "static/images/container_forward.png";
const iconContainerBackward = "static/images/container_backward.png";
const iconVesselForward = "static/images/vessel_forward.png";
const iconVesselBackward = "static/images/vessel_backward.png";
const iconTank = "static/images/tank.png";
const iconBulkCarrierForward = "static/images/bulkcarrier_forward.png";
const iconBulkCarrierBackward = "static/images/bulkcarrier_backward.png";
const iconCarShipForward = "static/images/carship_forward.png";
const iconCarShipBackward = "static/images/carship_backward.png";
const iconOilTankerForward = "static/images/oiltanker_forward.png";
const iconOilTankerBackward = "static/images/oiltanker_backward.png";


// Define fixed areas
var portARow = 2;
var portACol = 4;
var portAVacancy = true;
var portBRow = 4;
var portBCol = 4;
var portBVacancy = true;
var seaRow = 3;
var seaCol = 11;

// Vessel states
const RIGGING=0;
const ARRIVAL=1;
const RETURN=5; 
const REFUELLING=6;

// Ship states
const MOORING=0;
const UNMOORING =1;
const EXITED = 6;

// Common states for both Vessel and Ship
const SAFETY_CHECK=2; 
//const INSPECTION=3 //Not simulated
const BUNKERING =3;
const COMPLETE=4;

// Ship is a dynamic list, initially empty
var ships = [];
// Vessel is a static list, populated with Vessel A and Vessel B	
var vessels = [
    {"type":0,"label":"Vessel Bellina","location":{"row":2,"col":2},"target":{"row":2,"col":2},"state":RIGGING, "volume":7000, "maxvolume":7000},
	{"type":1,"label":"Vessel Venosa","location":{"row":4,"col":2},"target":{"row":4,"col":2},"state":RIGGING, "volume":16800, "maxvolume":16800}
];
var vessel_a = vessels[0];
var vessel_b = vessels[1];

//Counters for ship types per vessel
let shipServicedCounts = {
	bellina: {
		container: 0,
		bulkcarrier: 0,
		carcarrier: 0,
		oiltanker: 0
	},
	venosa: {
		container: 0,
		bulkcarrier: 0,
		carcarrier: 0,
		oiltanker: 0
	}
};

// Section our screen into different areas
var areas =[
 {"label":"LNG Facility","startRow":1,"numRows":5,"startCol":1,"numCols":1,"color":"#b3b3b3"},
 {"label":"Port","startRow":1,"numRows":5,"startCol":2,"numCols":8,"color":"#00c1e1"},
 {"label":"Sea_shallow","startRow":1,"numRows":5,"startCol":9,"numCols":2,"color":"#00c1e1"},
 {"label":"Sea_deep","startRow":1,"numRows":5,"startCol":11,"numCols":1,"color":"#27a8df"}	
]

var tanks =[
	{"label":"Tank 1","location":{"row":2,"col":1}},
	{"label":"Tank 2","location":{"row":3,"col":1}},
	{"label":"Tank 3","location":{"row":4,"col":1}},
   ]

var currentTime = 0;
// Idk what statistics to use yet
var statistics = [
{"name":"Average time bunkering: ","location":{"row":portARow,"col":portACol},"cumulativeValue":0,"count":0},
// {"name":"Average time bunkering, Ship B: ","location":{"row":doctorRow+4,"col":doctorCol-4},"cumulativeValue":0,"count":0}
];

// The probability of a patient arrival needs to be less than the probability of a departure, else an infinite queue will build.
// You also need to allow travel time for patients to move from their seat in the waiting room to get close to the doctor.
// So don't set probDeparture too close to probArrival.
var probArrival = 0.05;
var probDeparture = 0.4;

// We can have different types of patients (A and B) according to a probability, probTypeA.
// This version of the simulation makes no difference between A and B patients except for the display image
// Later assignments can build on this basic structure.
var probTypeA = 0.5;

// To manage the queues, we need to keep track of patientIDs.
// var nextPatientID_A = 0; // increment this and assign it to the next admitted patient of type A
// var nextPatientID_B = 0; // increment this and assign it to the next admitted patient of type B
// var nextTreatedPatientID_A =1; //this is the id of the next patient of type A to be treated by the doctor
// var nextTreatedPatientID_B =1; //this is the id of the next patient of type B to be treated by the doctor
var nextShipID = 0;

// Randomly get integers
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Initialization code --> executed when the script is loaded
(function() {
	// All elements of the DOM will be available here
	window.addEventListener("resize", redrawWindow); // Redraw whenever the window is resized
	simTimer = window.setInterval(simStep, animationDelay); // Call function simStep every animationDelay milliseconds
	redrawWindow();
})();

// Starts/Pauses simulation
function toggleSimStep(){ 
	isRunning = !isRunning;
	console.log("isRunning: "+isRunning);
}

function redrawWindow(){
	// isRunning = false; // used by simStep
	// window.clearInterval(simTimer); // clear the Timer
	// animationDelay = 550 - document.getElementById("slider1").value;
	// simTimer = window.setInterval(simStep, animationDelay); // call the function simStep every animationDelay milliseconds
	
	// Re-initialize simulation variables
	currentTime = 0;
	nextShipID=0; // increment this and assign it to the next entering ship
	vessel_a.state=RIGGING;
	vessel_b.state=RIGGING;
	ships = [];

	// Reset counters
	shipServicedCounts = {
		bellina: {
			container: 0,
			bulkcarrier: 0,
			carcarrier: 0,
			oiltanker: 0
		},
		venosa: {
			container: 0,
			bulkcarrier: 0,
			carcarrier: 0,
			oiltanker: 0
		}
	};
	
	updateShipCounters();

	// Remember to fix the statistics here
	statistics[0].cumulativeValue=0;
	statistics[0].count=0;
	// statistics[1].cumulativeValue=0;
	// statistics[1].count=0;

	// Resize the drawing surface; remove all its contents; 
	var drawsurface = document.getElementById("surface");
	var rect = drawsurface.getBoundingClientRect();
	var w = rect.width;
	var h = rect.height;
	var surfaceWidth =(w - 3*WINDOWBORDERSIZE);
	// console.log(surfaceWidth);
	var surfaceHeight= (h - 3*WINDOWBORDERSIZE);
	// console.log(surfaceHeight);
	
	// drawsurface.style.width = surfaceWidth+"px";
	// drawsurface.style.height = surfaceHeight+"px";
	drawsurface.style.left = WINDOWBORDERSIZE/2+'px';
	drawsurface.style.top = WINDOWBORDERSIZE/2+'px';
	// drawsurface.style.border = "thick solid #0000FF"; //for debugging
	drawsurface.innerHTML = ''; // Empties the contents of the drawing surface, like jQuery erase().
	
	// Compute the cellWidth and cellHeight
	cellWidth = surfaceWidth/maxCols;
	cellHeight  = surfaceHeight/maxRows;
	
	// Set the global variable, surface, equal to the d3 selection of the drawing surface
	surface = d3.select('#surface');
	surface.selectAll('*').remove(); // Because setting the inner html to blank may not remove all svg elements
	surface.style("font-size","100%");

	// Rebuild contents of the drawing surface
	updateSurface();	
};

// Window is resizable --> translate row and column coordinates into screen coordinates x and y
function getLocationCell(location){
	var row = location.row;
	var col = location.col;
	var x = (col-1)*cellWidth;
	var y = (row-1)*cellHeight;
	return {"x":x,"y":y};
}

function updateSurface(){
	// Create or update most of the svg elements on the drawing surface.
	// Those appended last, will overlay those appended before --> layer matter
	// removeDynamicAgents() removes svg elements

	// Background layout first
	var allareas = surface.selectAll(".areas").data(areas);
	var newareas = allareas.enter().append("g").attr("class","areas"); // Create an svg group ("g")

	// For each new area, append a rectangle to the group
	newareas.append("rect")
	.attr("x", function(d){return (d.startCol-1)*cellWidth;})
	.attr("y",  function(d){return (d.startRow-1)*cellHeight;})
	.attr("width",  function(d){return d.numCols*cellWidth;})
	.attr("height",  function(d){return d.numRows*cellHeight;})
	.style("fill", function(d) { return d.color; })
	// .style("stroke","black")
	// .style("stroke-width",1);

	// Add the LNG tanks
	var alltanks = surface.selectAll(".tank").data(tanks);
	var newtanks = alltanks.enter().append("g").attr("class","tank");

	newtanks.append("svg:image")
	.attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href",function(d){return iconTank;});



	// Vessels layout second --> no need to worry about removing them
	var allvessels = surface.selectAll(".vessel").data(vessels);
	var newvessels = allvessels.enter().append("g").attr("class","vessel"); // Create an svg group ("g")

	newvessels.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth/1.75,cellHeight/1.75)+"px")
	 .attr("height", Math.min(cellWidth/1.75,cellHeight/1.75)+"px")
	 .attr("xlink:href",function(d){return iconVesselForward});
	
	// Add labels
	newvessels.append("text")
    .attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth/2)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.label; });

	// Update their location on the screen
	var images = allvessels.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("xlink:href",function(d){
		if (d.state == RETURN || d.state == COMPLETE) {
			return iconVesselBackward;
		} else {
			return iconVesselForward;
		}})
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.

	
	// Ships layout third
	var allships = surface.selectAll(".ship").data(ships);
	// If the list of svg elements is longer than the data list, the excess elements are in the .exit() list
	// Excess elements need to be removed:
	allships.exit().remove(); // Needed when we resize window and re-initialize ships array
	// If the list of svg elements is shorter than the data list, the new elements are in the .enter() list.
	// The first time this is called, all the elements of data will be in the .enter() list.
	var newships = allships.enter().append("g").attr("class","ship"); 

	newships.append("svg:image")
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("width", Math.min(cellWidth,cellHeight)+"px")
	 .attr("height", Math.min(cellWidth,cellHeight)+"px")
	 .attr("xlink:href",function(d){
		switch (d.type) {
			case "carship":
				return iconCarShipForward;
			case "bulkcarrier":
				return iconBulkCarrierForward;
			case "oiltanker":
				return iconOilTankerForward;
			case "container":
				return iconContainerForward;
		}
	 });
	
	// For the existing ships --> update their location on the screen --> transition
	// First, we select the image elements in the allships list
	var images = allships.selectAll("image");
	// Next we define a transition for each of these image elements.
	// Note that we only need to update the attributes of the image element which change
	images.transition()
	 .attr("x",function(d){var cell= getLocationCell(d.location); return cell.x+"px";})
	 .attr("y",function(d){var cell= getLocationCell(d.location); return cell.y+"px";})
	 .attr("xlink:href",function(d){
		switch (d.type) {
			case "carship":
				return (d.state === COMPLETE || d.state === UNMOORING) ? iconCarShipBackward : iconCarShipForward;	
			case "bulkcarrier":
				return (d.state === COMPLETE || d.state === UNMOORING) ? iconBulkCarrierBackward : iconBulkCarrierForward;
			case "oiltanker":
				return (d.state === COMPLETE || d.state === UNMOORING) ? iconOilTankerBackward : iconOilTankerForward;
			case "container":
				return (d.state === COMPLETE || d.state === UNMOORING) ? iconContainerBackward : iconContainerForward;

		}
	 })
	 .duration(animationDelay).ease('linear'); // This specifies the speed and type of transition we want.
 
	
	// Statistics layer
	// The simulation should serve some purpose 
	// so we will compute and display the average length of stay of each patient type.
	// We created the array "statistics" for this purpose.
	// Here we will create a group for each element of the statistics array (two elements)
	var allstatistics = surface.selectAll(".statistics").data(statistics);

	var newstatistics = allstatistics.enter().append("g").attr("class","statistics");

	newstatistics.append("text")
	.attr("x", function(d) { var cell= getLocationCell(d.location); return (cell.x+cellWidth/2)+"px"; })
    .attr("y", function(d) { var cell= getLocationCell(d.location); return (cell.y+cellHeight/2)+"px"; })
    .attr("dy", ".35em")
    .text(""); 
	
	// The data in the statistics array are always being updated.
	// So, here we update the text in the labels with the updated information.
	allstatistics.selectAll("text").text(function(d) {
		var avgLengthOfStay = d.cumulativeValue/(Math.max(1,d.count)); // cumulativeValue and count for each statistic are always changing
		return d.name+avgLengthOfStay.toFixed(1); }); //The toFixed() function sets the number of decimal places to display
}
	

function addDynamicAgents(){
    // Create a ship
    if (Math.random()< probArrival){
        // Do not accept any ships if ports are full
        if (portAVacancy===true || portBVacancy===true){
            // Randomly choose a ship type
            const shipTypes = ["carship", "bulkcarrier", "oiltanker", "container"];
            const shipType = shipTypes[getRandomInt(0, 3)];
            
            // Determine which ports can service this ship type
            const canServicePortA = (shipType === "carship" || shipType === "bulkcarrier");
            const canServicePortB = true; // Venosa can service all types
            
            // Assign to an available port that can service this ship
            if (portAVacancy && canServicePortA) {
                var port = [0, portARow, portACol];
                seaRowExit = getRandomInt(1, 2);
                portAVacancy = false;
            } else if (portBVacancy && canServicePortB) {
                var port = [1, portBRow, portBCol];
                seaRowExit = getRandomInt(4, 5);
                portBVacancy = false;
            } else {
                return; // No available port can service this ship
            }

            // Create the new ship object
            var newship = {
                "id": nextShipID++,
				"type": ["carship", "bulkcarrier", "oiltanker","container"][getRandomInt(0,3)], //randomly chooses one of the four types of ships
                "location":{"row":4,"col":11},
                "target":{"row":port[1],"col":port[2]},
                "state":MOORING,
                "timeAdmitted":0,
                "port": port[0],
                "exit":{"row":seaRowExit,"col":seaCol}
            };
            
            ships.push(newship);
        }
    }
}

function updateShip(shipIndex){
	shipIndex = Number(shipIndex); // Since it comes as a string
	var ship = ships[shipIndex];

	// Get current location of ship
	var row = ship.location.row;
	var col = ship.location.col;
	// var type = ship.type;
	var state = ship.state;

	// Get corresponding vessel class
	if (ship.port == 0){
		var vessel = vessel_a;
	}
	else {
		var vessel = vessel_b;
	}
	
	
	// Determine if ship has arrived at destination
	var hasArrived = (Math.abs(ship.target.row-row)+Math.abs(ship.target.col-col))==0;
	
	switch(state){
		case MOORING:
			if (hasArrived){
				ship.timeAdmitted = currentTime;

				ship.state = SAFETY_CHECK;

				// update vessel
				vessel.state = ARRIVAL;
				if (ship.port == 0){
					vessel.target.row = 2;
					vessel.target.col = 4;
				}
				else{
					vessel.target.row = 4;
					vessel.target.col = 4;
				}
				
			}
		break;

		case SAFETY_CHECK:
			// Wait till vessel arrives then perform safety check
			console.log("currentTime");
			console.log(currentTime);
			if (vessel.state == SAFETY_CHECK){
				// Pause for 2 sec == 2hr
				if ((currentTime - ship.timeAdmitted) >= 2){
					ship.state = BUNKERING;
					vessel.state = BUNKERING;
				}
			}
		break;

		case BUNKERING:
			// Pause for 4 sec == 4hr
			if ((currentTime - ship.timeAdmitted) >= 4){
				ship.state = COMPLETE;
				vessel.state = COMPLETE;

				// Deduct random LNG amount from vessel
				let amountUsed = getRandomInt(500, 1500); //Range from 500 to 1500
				vessel.volume -= amountUsed;
				if (vessel.volume < 0) vessel.volume = 0;

				// Count the ship type for the vessel
				if (ship.port == 0) { // Vessel Bellina
					shipServicedCounts.bellina[ship.type]++;
				} else { // Vessel Venosa
					shipServicedCounts.venosa[ship.type]++;
				}
				
				// Update the DOM counters
				updateShipCounters();
			}

			// setTimeout(function() {
			// 	ship.state = COMPLETE;
			// }, 4000); 
		break;

		case COMPLETE:
			// Complete treatment randomly according to the probability of departure
			// 	if (Math.random()< probDeparture){
			// 		ship.state = COMPLETE;
			// 		vessel_a.state = COMPLETE;
			// 		// patient.target.row = receptionistRow;
			// 		// patient.target.col = receptionistCol;
			// 	}

			// Pause for 500 milisec == 30min?
			ship.state = UNMOORING;
			ship.target.row = ship.exit.row;
			ship.target.col = ship.exit.col;

			vessel.state = RETURN;
			if (vessel.type == 0){
				vessel.target.row = 2;
				vessel.target.col = 4;
			}
			else{
				vessel.target.row = 4;
				vessel.target.col = 4;
			}

			var timeBunkering = currentTime - ship.timeAdmitted;

			// compute statistics for leaving ship
			var stats;
			stats = statistics[0]
			// 	// if (patient.type=="A"){
			// 	// 	stats = statistics[0];
			// 	// }else{
			// 	// 	stats = statistics[1];
			// 	// }
			stats.cumulativeValue = stats.cumulativeValue+timeBunkering;
			stats.count = stats.count + 1;
			

			// setTimeout(function() {
			// 	ship.state = UNMOORING;
			// 	ship.target.row = ship.exit.row;
			// 	ship.target.col = ship.exit.col;

			// 	var timeBunkering = currentTime - ship.timeAdmitted;

			// 	// compute statistics for leaving ship
			// 	var stats;
			// 	stats = statistics[0]
			// 	// 	// if (patient.type=="A"){
			// 	// 	// 	stats = statistics[0];
			// 	// 	// }else{
			// 	// 	// 	stats = statistics[1];
			// 	// 	// }
			// 	stats.cumulativeValue = stats.cumulativeValue+timeBunkering;
			// 	stats.count = stats.count + 1;
			// }, 500);
		break;

		case UNMOORING: // last case, by right they should exit
			if (hasArrived){
				ship.state = EXITED;
			}
		break;

		default:
		break;
	}

	var targetRow = ship.target.row;
	var targetCol = ship.target.col;

	// Compute distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// Set speed
	var cellsPerStep = 1;

	// Compute the cell to move to
	var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
	var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo);
	
	// Update the location of ship
	ship.location.row = newRow;
	ship.location.col = newCol;

	// Update port state for every ship if they're leaving'
	// console.log('ship.state==COMPLETE');
	// console.log(ship.state==COMPLETE);
	if (ship.state==COMPLETE && ship.port==0){
		portAVacancy = true;
		// console.log(ship)
	}
	else if (ship.state==COMPLETE && ship.port==1){
		portBVacancy = true;
	}
	console.log('State port A');
	console.log(portAVacancy);
	console.log('State port B');
	console.log(portBVacancy);
}

function updateVessel(vesselIndex){
	vesselIndex = Number(vesselIndex);
	var vessel = vessels[vesselIndex];

	// Get current location of vessel
	var row = vessel.location.row;
	var col = vessel.location.col;
	// var type = ship.type;
	var state = vessel.state;
	
	// Determine if vessel has arrived at destination
	var hasArrived = (Math.abs(vessel.target.row-row)+Math.abs(vessel.target.col-col))==0;
	
	console.log("vessel state");
	console.log(state)
	switch(state){
		case ARRIVAL:
			if (hasArrived){
				// vessel.timeAdmitted = currentTime;
				vessel.state = SAFETY_CHECK;
			}
		break;

		case RETURN:
			if (hasArrived){
				if (vessel.volume < 100){
					vessel.state = REFUELLING;
					vessel.target = (vessel.type === 0)
					? {row: 2, col: 2} //Tank for Bellina
					: {row: 4, col: 2} //Tank for Venosa
					console.log(`${vessel.label} refueled back to ${vessel.volume} m³`);
				} else{
				vessel.state = RIGGING;
				}
			}
		break;

		case REFUELLING:
			if (hasArrived) {
				vessel.volume = vessel.maxvolume
				console.log(`${vessel.label} has refueled to ${vessel.volume} m³`);
				vessel.state = RIGGING;
			}
		break;

		default:
		break;
	}

	var targetRow = vessel.target.row;
	var targetCol = vessel.target.col;

	// Compute distance to the target destination
	var rowsToGo = targetRow - row;
	var colsToGo = targetCol - col;
	// Set speed
	var cellsPerStep = 1;

	// Compute the cell to move to
	var newRow = row + Math.min(Math.abs(rowsToGo),cellsPerStep)*Math.sign(rowsToGo);
	var newCol = col + Math.min(Math.abs(colsToGo),cellsPerStep)*Math.sign(colsToGo);
	
	// Update the location of vessel
	vessel.location.row = newRow;
	vessel.location.col = newCol;
}

function removeDynamicAgents(){
	// We need to remove ships who have been bunkered 
	//Select all svg elements of class "ship" and map it to the data list called ships
	var allships = surface.selectAll(".ship").data(ships);
	//Select all the svg groups of class "ship" whose state is EXITED
	var bunkeredShips = allships.filter(function(d,i){return d.state==EXITED;});

	// Remove the svg groups of EXITED patients: they will disappear from the screen at this point
	bunkeredShips.remove();

	// Remove the EXITED ships from the ships list using a filter command
	ships = ships.filter(function(d){return d.state!=EXITED;});
}


function updateDynamicAgents(){
	// Loop over all agents and update their states
	for (var shipIndex in ships){
		updateShip(shipIndex);
	}
	for (var vesselIndex in vessels){
		updateVessel(vesselIndex);
	}
	updateSurface();	
}


function simStep(){
	// This function is called by a timer; if running, it executes one simulation step 
	// The timing interval is set in the page initialization function near the top of this file
	if (isRunning){ // Toggled by toggleSimStep
		// Increment current time (for computing statistics)
		currentTime++;
		//Updates grey sidebar display
		updateCurrentCycleDisplay(currentTime);
		// Sometimes new agents will be created in the following function
		addDynamicAgents();
		// In the next function we update each agent
		updateDynamicAgents();
		// Sometimes agents will be removed in the following function
		removeDynamicAgents();
	}
}

//updates Current cycle in grey sidebar
function updateCurrentCycleDisplay(time){
	const day = Math.floor(time/24) + 1;
	const hour = Math.floor(time % 24);

	//Update DOM - match to actual sidebar element IDs
	document.getElementById("bellina-day").innerText = `Day: ${day}`;
	document.getElementById("bellina-time").innerText = `Current time: ${hour}:00 h`;

	document.getElementById("venosa-day").innerText = `Day: ${day}`;
	document.getElementById("venosa-time").innerText = `Current time: ${hour}:00 h`;

	// Update volume of LNG for bellina and venosa in the DOM
	document.getElementById("bellina-volume").innerText = vessel_a.volume.toFixed(0);
	document.getElementById("venosa-volume").innerText = vessel_b.volume.toFixed(0);

	//colour warning (red if volume of LNG is less than 100)
	document.getElementById("bellina-volume").style.color = vessel_a.volume < 100 ? "red" : "black";
	document.getElementById("venosa-volume").style.color = vessel_b.volume < 100 ? "red" : "black";
}

//updates Ship count in grey sidebar
function updateShipCounters() {
    // Update Venosa counters
    document.getElementById("venosa-container-count").innerText = `Container vessel: ${shipServicedCounts.venosa.container}`;
    document.getElementById("venosa-bulkcarrier-count").innerText = `Bulk Carrier: ${shipServicedCounts.venosa.bulkcarrier}`;
    document.getElementById("venosa-carcarrier-count").innerText = `Car Carrier: ${shipServicedCounts.venosa.carcarrier}`;
    document.getElementById("venosa-oiltanker-count").innerText = `Oil tanker: ${shipServicedCounts.venosa.oiltanker}`;
    
    // Update Bellina counters
    document.getElementById("bellina-container-count").innerText = `Container vessel: ${shipServicedCounts.bellina.container}`;
    document.getElementById("bellina-bulkcarrier-count").innerText = `Bulk Carrier: ${shipServicedCounts.bellina.bulkcarrier}`;
    document.getElementById("bellina-carcarrier-count").innerText = `Car Carrier: ${shipServicedCounts.bellina.carcarrier}`;
    document.getElementById("bellina-oiltanker-count").innerText = `Oil tanker: ${shipServicedCounts.bellina.oiltanker}`;
}

//updates speed of simulation smoothly, without redrawing window
function updateSpeedOnly() {
	const newDelay = Math.max(50, 550 - document.getElementById("slider1").value);
	clearInterval(simTimer);
	simTimer = setInterval(simStep, newDelay);
	animationDelay = newDelay;
}
