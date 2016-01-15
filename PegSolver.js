

// Moves will be a coordinate and direction, where direction is north, south, east or west
// i.e.   move = {
//	  x: 1,
//	  y: 3,
//    direction: S
//}
// This indicates that peg at 1,3 should be moved south two places and the peg and 1,4 should be removed
// Coordinates are zero based as they are array indecies

self.addEventListener("message", function(e) {
  var data = e.data;
  switch (data.cmd) {
    case "start":
	  solve(data.board);
      break;
    case "stop":
	  console.log("Stopping worker.");
      self.close(); // Terminates the worker.
      break;
    default:
      self.postMessage("Unknown command: " + data.msg);
  }
}, false);

function sendSolution(solution){
	self.postMessage({type:"solution","solution":solution});
}

function storeCorrectMove(correctMoves, move){
	correctMoves.unshift(move);
}

function countPegs(array){
	var count = 0;
	var rows = array.length;
	var cols = array[0].length;
	
	for (var y=0; y<rows; y++){
		for(var x=0; x<cols; x++){
			if (array[y][x] === "p"){
				count++;
			}
		}
	}
	return count;
}

function makeMove(board, move){
	// Need a deep clone of the array (Don't use array.slice!)
	var clone = board.map(function(arr) {
		return arr.slice();
	});
	if (clone[move.y][move.x] !== "p"){
		throw "Invalid move! " + move.x + ", " + move.y + " direction: " + move.direction;
	}
	clone[move.y][move.x] = "s";
	switch(move.direction){
		case "N":
			clone[move.y-1][move.x] = "s";
			clone[move.y-2][move.x] = "p";
			break;
		case "E":
			clone[move.y][move.x+1] = "s";
			clone[move.y][move.x+2] = "p";
			break;
		case "S":
			clone[move.y+1][move.x] = "s";
			clone[move.y+2][move.x] = "p";
			break;
		case "W":
			clone[move.y][move.x-1] = "s";
			clone[move.y][move.x-2] = "p";
			break;
		default:
			throw "Unknown move direction: " + move.direction;
	}
	return clone;
}

function getPossibleMoves(array){
	var moves = [];
	// Create list of possible moves
	// Loop over each element seeing if it can move in any direction
	var rows = array.length;
	var cols = array[0].length;
	
	for (var y=0; y<rows; y++){
		for(var x=0; x<cols; x++){
			var cell = array[y][x];
			// If this is not a peg continue
			if (cell != "p"){
				continue;
			}
			// Check all four directions, look for peg next to us and space after that
			// North
			if (y>1 && array[y-1][x] == "p" && array[y-2][x] == "s"){
				moves.push({x:x, y:y, direction:"N"});
			}
			// East
			if (x+2<cols && array[y][x+1] == "p" && array[y][x+2] == "s"){
				moves.push({x:x, y:y, direction:"E"});
			}
			// South
			if (y+2<rows && array[y+1][x] == "p" && array[y+2][x] == "s"){
				moves.push({x:x, y:y, direction:"S"});
			}
			// West
			if (x>1 && array[y][x-1] == "p" && array[y][x-2] == "s"){
				moves.push({x:x, y:y, direction:"W"});
			}
		}
	}
	return moves;
}

function printMove(move){
		console.log("Move: " + move.x + ", " + move.y + ", direction: " + move.direction)
}

function printCorrectMoves(correctMoves) {
	if (correctMoves.length > 0){
		console.log("Total moves: " + correctMoves.length)
	}
	var move = correctMoves.pop();
	while(move) {
		printMove(move);
        move = correctMoves.pop()
	}
}

function printArray(array){
	var rowText;			
	for (var y=0; y<array.length; y++){
		rowText = "[";
		for(var x=0; x<array[0].length; x++){
			if (x>0){
				rowText += ",";
			}
			rowText += array[y][x];
		}
		rowText += "]";
		console.log(rowText);
		
	}
}

function incrementAttempts(solution){
	solution.attempts++;
	if (solution.attempts % 1000 === 0){
		sendSolution(solution);
	}
}

function doSolve(array, solution){
	var moves = getPossibleMoves(array);
	for(var i=0;i<moves.length;i++){
		incrementAttempts(solution);
		var newArray = makeMove(array, moves[i]);
		if (countPegs(newArray) === 1){
			storeCorrectMove(solution.correctMoves, moves[i]);
			solution.solved = true;
			return;
		}
		doSolve(newArray, solution);
		if (solution.solved){
			storeCorrectMove(solution.correctMoves, moves[i]);
			return;
		}
	}
}

function arrayValid(array){
	if (array.length === 0) {
		console.log("Zero length array");
		return false;
	}
	var columnCount = array[0].length;
	for(var i=1; i<array.length; i++){
		if (array[i].length !== columnCount){
			console.log("Array rows differ in length");
			return false;
		}
	}
	return true;
}

// The array is a two dimensional array with three possible values for each cell
// s = Space
// p = Peg
// w = Wall
function solve(array){
	if (!arrayValid(array)){
		return;
	}
	
	var solution = {
		solved:false,
		processing:true,
		attempts:0,
		correctMoves:[]
	};
	
	doSolve(array, solution);
	solution.processing = false;
	sendSolution(solution);
}
