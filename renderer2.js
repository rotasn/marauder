const { receive } = window.electronAPI;

const mapContainer = document.getElementById('mapContainer');
const mapSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
mapSvg.setAttribute('viewBox', `0 0 2000 2000`); 

mapSvg.setAttribute('id', 'mapSvg');
mapSvg.setAttribute('width', mapContainer.clientWidth); // Setting initial width
mapSvg.setAttribute('height', mapContainer.clientHeight); // and height.
mapContainer.appendChild(mapSvg);
const roomElements = {};
let currentRoom = null;
let currentLayer = 5;

const roomPositions = {};




// Connections between rooms for each layer
let connections = {
  "0": {},
  "1": {},
  "2": {},
  "3": {},
  "4": {},
  "5": {},
  "6": {},
  "7": {},
  "8": {},
  "9": {},
  "10": {}
};


let agentActive = false;  
let exploredRooms = {};  
let unexploredRooms = []; 
let backtrackPath = [];  
let directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
let lastRoom = null;
let fullyExploredCount = {};


function startAgent() {
  agentActive = true;
  if (!exploredRooms[currentRoom]) {
      exploredRooms[currentRoom] = { explored: new Set(), directionIndex: 0, isFullyExplored: false };
  }
  unexploredRooms.push(currentRoom); 
  backtrackPath.push({ room: currentRoom, direction: null });
  lastRoom = currentRoom;  // Initialize lastRoom here
  tryNextDirection(); 
}

function tryNextDirection() {
  if (!agentActive || unexploredRooms.length === 0) return;  // Stop if agent is inactive

  let roomData = exploredRooms[currentRoom];

  // Debug: Log current room and directions
  //console.log(`Trying next direction in room: ${currentRoom}`);
  //console.log(`Explored directions so far: ${Array.from(roomData.explored)}`);
  
  if (roomData.directionIndex >= directions.length) {
      markRoomFullyExplored(currentRoom);
      logUnexploredRooms(); // Log the unexplored rooms here
      if (!agentActive) return;  // Stop immediately if agent was deactivated
      moveToNextRoom(); 
      return;
  }

  const direction = directions[roomData.directionIndex];
  if (!roomData.explored.has(direction)) {
      sendDirectionInput(direction);
      roomData.explored.add(direction);

      setTimeout(() => {
          checkRoomChange(direction);
      }, 3000);  // Adjust delay if needed
  } else {
      roomData.directionIndex += 1;
      tryNextDirection();
  }
}


function findPathToUnexploredRoom(targetRoom) {
  let queue = [{ room: currentRoom, path: [] }];
  let visited = new Set([currentRoom]);

  while (queue.length > 0) {
      let { room, path } = queue.shift();

      // If we reach the target room, return the path
      if (room === targetRoom) {
          return path;
      }

      // Explore all connected rooms
      for (const direction of directions) {
          let nextRoom = getDestinationRoom(room, direction);
          if (nextRoom && !visited.has(nextRoom)) {
              visited.add(nextRoom);
              queue.push({ room: nextRoom, path: [...path, direction] });
          }
      }
  }

  // Return null if no path is found
  return null;
}



function logUnexploredRooms() {
  const unexploredRoomsLog = [];

  console.log("Logging unexplored rooms...");

  for (const room in exploredRooms) {
      const roomData = exploredRooms[room];
      const unexploredDirections = directions.filter(dir => !roomData.explored.has(dir));

      console.log(`Room: ${room}, Explored Directions: ${Array.from(roomData.explored)}, Unexplored Directions: ${unexploredDirections}`);

      if (unexploredDirections.length > 0) {
          unexploredRoomsLog.push(`${room}: ${unexploredDirections.join(', ')}`);
      }
  }

  if (unexploredRoomsLog.length > 0) {
      console.log('Unexplored Rooms and Directions:', unexploredRoomsLog);
  } else {
      console.log('All rooms are fully explored!');
  }
}




function getDestinationRoom(currentRoom, direction) {
  const connectionKey = Object.keys(connections[currentLayer.toString()])
    .find(key => key.startsWith(`${currentRoom}_`) && connections[currentLayer.toString()][key].direction === direction);

  if (connectionKey) {
    return connectionKey.split('_')[1]; 
  } else {
    return null; 
  }
}

// Function to simulate sending directional input
function sendDirectionInput(direction) {
  console.log(`Sent direction: ${direction}`);
  const inputField = document.querySelector('#windowport input[type="text"]');
  if (inputField) {
      inputField.focus();
      inputField.value = direction;
      inputField.dispatchEvent(new Event('input', { bubbles: true }));

      const keypressEvent = $.Event("keypress", { which: 13 });
      $(inputField).trigger(keypressEvent);
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      inputField.dispatchEvent(keydownEvent);
  }
}

// Function to check if a room change occurred after moving in a direction
function checkRoomChange(direction) {
  if (currentRoom !== lastRoom) {
      console.log(`Moved to a new room: ${currentRoom}`);

      // Initialize exploration state for new room
      if (!exploredRooms[currentRoom]) {
          exploredRooms[currentRoom] = { explored: new Set(), directionIndex: 0, isFullyExplored: false };
          console.log(`New room initialized: ${currentRoom}`);
      }

      unexploredRooms.push(currentRoom);  // Add new room to the unexplored stack
      backtrackPath.push({ room: currentRoom, direction: reverseDirection(direction) });
      lastRoom = currentRoom;
      
      setTimeout(tryNextDirection, 3000);
  } else {
      console.log(`Room did not change after direction: ${direction}`);
      moveToNextDirection();
  }
}


// Function to move to the next unexplored direction in the current room
function moveToNextDirection() {
  const roomData = exploredRooms[currentRoom];
  roomData.directionIndex += 1;

  if (roomData.directionIndex < directions.length) {
      setTimeout(tryNextDirection, 3000);
  } else {
      markRoomFullyExplored(currentRoom);
      if (!agentActive) return;  // Stop exploration if the agent was halted
      moveToNextRoom();  // Move to the next room after full exploration
  }
}


// Function to move to the next room that needs explorationfunction moveToNextRoom() {
    if (backtrackPath.length > 1) {
      isBacktracking = true; 
      setTimeout(() => {
          backtrack();
          isBacktracking = false; 
      }, 2000); // Adjust delay if needed
  } else {
      let nextRoom = unexploredRooms.find(room => !exploredRooms[room].isFullyExplored); 
      if (nextRoom) {
          setTimeout(tryNextDirection, 3000);
      } else {
          console.log('Exploration complete.');
          agentActive = false;
      }
  }
  function moveToNextRoom() {
    // Find the next unexplored room
    let nextRoom = unexploredRooms.find(room => !exploredRooms[room].isFullyExplored);
    
    if (nextRoom) {
        console.log(`Next unexplored room: ${nextRoom}`);
        
        // Find the path to the next unexplored room
        let path = findPathToUnexploredRoom(nextRoom);

        if (path && path.length > 0) {
            console.log(`Path to ${nextRoom}: ${path.join(', ')}`);
            
            // Follow the path step by step
            followPath(path);
        } else {
            console.log(`No path found to ${nextRoom}, attempting backtracking...`);
            backtrack();
        }
    } else {
        console.log('Exploration complete. All rooms are fully explored.');
        agentActive = false;
    }
}


function followPath(path) {
  if (path.length === 0) {
      console.log('Arrived at the unexplored room. Resuming exploration...');
      setTimeout(tryNextDirection, 3000);  // Resume exploration
      return;
  }

  // Take the next direction from the path
  let nextDirection = path.shift();
  console.log(`Moving in direction: ${nextDirection}`);

  // Simulate the agent moving in that direction
  sendDirectionInput(nextDirection);

  // After a small delay, continue following the path
  setTimeout(() => {
      followPath(path);
  }, 3000);
}



function backtrack() {
  const backtrackStep = backtrackPath.pop();
  if (backtrackStep) {
      const { room, direction } = backtrackStep;
      console.log(`Backtracking to ${room} via ${direction}`);
      sendDirectionInput(direction);
      lastRoom = room;
      setTimeout(tryNextDirection, 3000);
  }
}

// Function to mark a room as fully explored
function markRoomFullyExplored(room) {
  if (!fullyExploredCount[room]) {
      fullyExploredCount[room] = 0;  // Initialize the count
  }

  fullyExploredCount[room] += 1;  // Increment the count
  console.log(`${room} is fully explored.`);

  exploredRooms[room].isFullyExplored = true;
  unexploredRooms = unexploredRooms.filter(r => r !== room);

  // Log unexplored rooms after marking one as fully explored
  logUnexploredRooms();

  // Stop exploration if the room was fully explored multiple times
  if (fullyExploredCount[room] > 20) {
      console.log(`${room} was marked fully explored multiple times. Stopping exploration.`);
      agentActive = false;
      return;
  }
}



// Function to reverse the direction for backtracking
function reverseDirection(direction) {
    const reverseMap = {
        'north': 'south',
        'south': 'north',
        'east': 'west',
        'west': 'east',
        'northeast': 'southwest',
        'northwest': 'southeast',
        'southeast': 'northwest',
        'southwest': 'northeast'
    };
    return reverseMap[direction];
}

// Exploration stops if the user presses control + s
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 's') {
      stopAgent();
  }
});

function stopAgent() {
  agentActive = false;
  console.log('Exploration has been stopped via keyboard shortcut.');
}

//A viewbox's 0,0 is in the top left corner of the svg, negative coordinates for rooms mean it is not visible

function expandMapIfNeeded(x, y) {
  let [viewBoxMinX, viewBoxMinY, viewBoxWidth, viewBoxHeight] = mapSvg
    .getAttribute('viewBox')
    .split(' ')
    .map(Number);

  // Calculate expansion amounts dynamically
  const expansionAmountX = Math.max(0, -x + 50); // Expand leftward if x is negative, add some buffer
  const expansionAmountY = Math.max(0, -y + 50); // Expand upward if y is negative

  // Expand viewBox if needed
  if (expansionAmountX > 0 || x + 140 > viewBoxWidth) {
    viewBoxWidth += expansionAmountX + Math.max(0, x + 140 - viewBoxWidth);
  }
  if (expansionAmountY > 0 || y + 70 > viewBoxHeight) {
    viewBoxHeight += expansionAmountY + Math.max(0, y + 70 - viewBoxHeight);
  }

  // Adjust viewBoxMinX and viewBoxMinY if needed to keep room coordinates positive
  viewBoxMinX = Math.min(viewBoxMinX, x); 
  viewBoxMinY = Math.min(viewBoxMinY, y);

  // Update SVG dimensions and viewBox
  mapSvg.setAttribute('width', viewBoxWidth);
  mapSvg.setAttribute('height', viewBoxHeight);
  mapSvg.setAttribute('viewBox', `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
}

const addRoomButton = document.getElementById('addRoomButton');
const addRoomModal = document.getElementById('addRoomModal');
const submitRoomButton = document.getElementById('submitRoomButton');
const closeModalButton = document.getElementById('closeModalButton');
const roomNameInput = document.getElementById('roomName');
const cancelLineCreationButton = document.getElementById('cancelLineCreationButton'); // X button to cancel line creation, could be something more interesting

let isCreatingConnection = false;
let sourceRoom = null;

// Show modal when the "add room" button is clicked
addRoomButton.addEventListener('click', () => {
  addRoomModal.style.display = 'block';
});

// close it when the "cancel" button is clicked
closeModalButton.addEventListener('click', () => {
  addRoomModal.style.display = 'none';
});

// you must enter a room name
submitRoomButton.addEventListener('click', () => {
  const roomName = roomNameInput.value.trim();

  if (!roomName) {
    alert('Room name is required!');
    return;
  }

  let x = 200, y = 200; // Default position for new rooms

  // add the room to the map
  createRoom(roomName, x, y, currentLayer);
  roomPositions[roomName] = { x, y, z: currentLayer };
  //console.log(`Room "${roomName}" added at layer ${currentLayer}.`);

  // close modal after submission
  addRoomModal.style.display = 'none';

  // clear input feild for next use
  roomNameInput.value = '';
});


/*------------------------------------- ROOMS & CONNNECTIONS ------------------------------------- */

// Function to create a new room element
function createRoom(name, x, y, z = 0) {
  const roomSpacing = calculateDynamicRoomSpacing(); // Calculate spacing dynamically
  const roomGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  roomGroup.setAttribute('class', 'room'); /*setting its class to "room" for easier styling with CSS */
  roomGroup.setAttribute('transform', `translate(${x}, ${y})`); // positioning the group in the SVG
  
  //show/move/hide room's name next to it during mousover handled by the tooltip at the end of createRoom
  roomGroup.addEventListener('mouseover', (event) => {
      tooltip.textContent = name;
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY + 10}px`;
  });

  roomGroup.addEventListener('mousemove', (event) => {
      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY + 10}px`;
  });

  roomGroup.addEventListener('mouseout', () => {
      tooltip.style.display = 'none';
  });

  // context menu event listener
  roomGroup.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu

    /*            CONTEXT MENU / ROOM OPTIONS           */

    const rect = roomGroup.querySelector('rect'); // Get the rectangle element
    const roomBox = rect.getBoundingClientRect(); // Get the bounding box of the room




      const menu = document.createElement('div');
      menu.style.position = 'absolute';
      menu.style.left = `${roomBox.right + 2}px`;  // 10px padding from the right side of the room
      menu.style.top = `${roomBox.top - 43}px`;  // Center vertically
      menu.style.borderRadius = '10px';  // Rounded edges
      menu.style.background = 'rgba(255, 255, 255, 0.7)';
      menu.style.border = '1px solid black';   
      menu.style.fontFamily = 'gawaa';

      // "Notes" option to the context menu
    const notesOption = document.createElement('div');
    notesOption.textContent = 'Notes';
    notesOption.style.padding = '5px';
    notesOption.style.cursor = 'pointer';
    notesOption.addEventListener('click', () => {
        showNotes(name); // Call the showNotes function when selected
        menu.remove();
    });
    menu.appendChild(notesOption);



    

    
      //"Travel" option
    const travelOption = document.createElement('div');
    travelOption.textContent = 'Travel to room';
    travelOption.style.padding = '5px';
    travelOption.style.cursor = 'pointer';
    travelOption.addEventListener('click', () => {
      travelToRoom(name); // Call travelToRoom function when selected
      menu.remove();
    });
    menu.appendChild(travelOption);


     //"Create Connection" option
     const createConnectionOption = document.createElement('div');
     createConnectionOption.textContent = 'Create Connection';
     createConnectionOption.style.padding = '5px';
     createConnectionOption.style.cursor = 'pointer';
     createConnectionOption.addEventListener('click', () => {
       startConnection(name); // Start the connection creation process
       menu.remove();
     });
     menu.appendChild(createConnectionOption);


     //"Move indicator here" option
    const moveHere = document.createElement('div');
    moveHere.textContent = 'Move indicator here';
    moveHere.style.padding = '5px';
    moveHere.style.cursor = 'pointer';
    moveHere.addEventListener('click', () => {
      manualIndicatorMove(name); 
      menu.remove();
    });
    menu.appendChild(moveHere);

    // "Intelligent Travel" option
const intelligentTravelOption = document.createElement('div');
intelligentTravelOption.textContent = 'Explore layer';
intelligentTravelOption.style.padding = '5px';
intelligentTravelOption.style.cursor = 'pointer';
intelligentTravelOption.addEventListener('click', () => {
    startAgent();  // Trigger the intelligent agent exploration
    menu.remove();  // Close the context menu
});
menu.appendChild(intelligentTravelOption);
      
     //"Remove" option
     const removeOption = document.createElement('div');
     removeOption.textContent = 'Remove';
     removeOption.style.padding = '5px';
     removeOption.style.cursor = 'pointer';
     removeOption.addEventListener('click', () => {
       deleteRoom(name);
       menu.remove();
     });
     menu.appendChild(removeOption);
 
    
 
     document.body.appendChild(menu);
 
     // close the menu on clicks outside
     const closeMenu = (e) => {
       if (!menu.contains(e.target)) {
         menu.remove();
         document.removeEventListener('click', closeMenu);
       }
     };
     document.addEventListener('click', closeMenu);
   });

  //The shape of the room

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', 140);
  rect.setAttribute('height', 70);
  rect.setAttribute('stroke', 'black');
  rect.setAttribute('stroke-width', 2);
  rect.setAttribute('fill', `url(#roomGradientLayer${z})`); // use the gradient for the current layer
  rect.setAttribute('rx', '10');  // Rounded corners (horizontal radius)
  rect.setAttribute('ry', '10');  // Rounded corners (vertical radius)
  roomGroup.appendChild(rect);

  // Add gloss rectangle with a transparent gradient
  const glossRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  glossRect.setAttribute('width', 140);
  glossRect.setAttribute('height', 70);
  glossRect.setAttribute('rx', '10');  // Keep the rounded corners consistent
  glossRect.setAttribute('ry', '10');
  glossRect.setAttribute('fill', 'url(#glossGradient)');  // Use the gloss gradient
  roomGroup.appendChild(glossRect);  // Overlay the gloss


  //the gradient of the room

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');   

  gradient.setAttribute('id',`roomGradientLayer${z}`); // unique ID for each layer
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  // defined gradient stops based on the layer (z)
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');

  // The colors of the room, for each layer.
  switch (z) {
    case 0:
        stop1.setAttribute('stop-color', '#f75307'); 
        stop2.setAttribute('stop-color', '#bd4913'); 
        break;
    case 1:
        stop1.setAttribute('stop-color', '#fa9c05'); 
        stop2.setAttribute('stop-color', '#a86a05'); 
        break;
    case 2:
        stop1.setAttribute('stop-color', '#adb005'); 
        stop2.setAttribute('stop-color', '#787a07'); 
        break;
    case 3:
        stop1.setAttribute('stop-color', '#8df505'); 
        stop2.setAttribute('stop-color', '#66b005'); 
        break;
    case 4:
        stop1.setAttribute('stop-color', '#04cc40');
        stop2.setAttribute('stop-color', '#03912e');
        break;
    case 5:
        stop1.setAttribute('stop-color', '#a8643c'); 
        stop2.setAttribute('stop-color', '#7a3209'); 
        break;
    case 6:
        stop1.setAttribute('stop-color', '#03dbfc'); 
        stop2.setAttribute('stop-color', '#04a6bf'); 
        break;
    case 7:
        stop1.setAttribute('stop-color', '#e102f5'); 
        stop2.setAttribute('stop-color', '#9403a1'); 
        break;
    case 8:
        stop1.setAttribute('stop-color', '#fa02c8'); 
        stop2.setAttribute('stop-color', '#c704a0');
        break;
    case 9:
        stop1.setAttribute('stop-color', '#f5025f');
        stop2.setAttribute('stop-color', '#a60543');
        break;
    case 10:
        stop1.setAttribute('stop-color', '#f70202');
        stop2.setAttribute('stop-color', '#9e0303');
        break;
    default:
        stop1.setAttribute('stop-color', '#c6c6c6'); 
        stop2.setAttribute('stop-color', '#aaaaaa'); 
}


  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  // Gloss gradient
  const glossGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  glossGradient.setAttribute('id', 'glossGradient');
  glossGradient.setAttribute('x1', '100%');
  glossGradient.setAttribute('y1', '0%');
  glossGradient.setAttribute('x2', '0%');
  glossGradient.setAttribute('y2', '0%');

  const glossStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  glossStop1.setAttribute('offset', '0%');
  glossStop1.setAttribute('stop-color', '#ffffff');  // Bright white for gloss
  glossStop1.setAttribute('stop-opacity', '0.3');  // Semi-transparent

  const glossStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  glossStop2.setAttribute('offset', '50%');
  glossStop2.setAttribute('stop-color', '#f1f1f1');
  glossStop2.setAttribute('stop-opacity', '0.1');  // Fading out

  const glossStop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  glossStop3.setAttribute('offset', '100%');
  glossStop3.setAttribute('stop-color', '#cccccc');
  glossStop3.setAttribute('stop-opacity', '0');  // Fully transparent at the end

  glossGradient.appendChild(glossStop1);
  glossGradient.appendChild(glossStop2);
  glossGradient.appendChild(glossStop3);
  defs.appendChild(glossGradient);

  mapSvg.appendChild(defs);



  //the text of the room

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', 70); 
  text.setAttribute('y', 35); 
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', 'white');
  text.style.fontFamily = 'gawaa', 'sans-serif';
  text.style.fontSize = '14px';
  

  //helper function to get width of text of room
  function getTextWidth(text, font) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = font;
    return context.measureText(text).width;
  }

  // Function to split text and add tspans for each line
  function fitTextinRoom(textElement, textContent, maxWidth) {
    const words = textContent.split(' ');
    let line = '';
    let yOffset = 0;

    words.forEach((word, index) => {
      const testLine = line + word + ' ';
      const testWidth = getTextWidth(testLine, '14px gawaa'); // Measure text width using the helper function

      if (testWidth > maxWidth && line !== '') {
        // current line as a tspan
        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.setAttribute('x', 70); //horizontal centering
        tspan.setAttribute('dy', yOffset); // and vertical offset for each line
        tspan.textContent = line.trim();
        textElement.appendChild(tspan);
        line = word + ' ';
        yOffset = 16; // move to the next line
      } else {
        line = testLine;
      }
    });

    // addition of remaining text as the final line
    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
    tspan.setAttribute('x', 70);
    tspan.setAttribute('dy', yOffset);
    tspan.textContent = line.trim();
    textElement.appendChild(tspan);
  }

  fitTextinRoom(text, name, 130); // max width is 130 (room width minus some padding)

  roomGroup.appendChild(text);




  // Check if notes exist for this room
  const notes = roomNotes[name];
  if (notes && notes.trim() !== '') {
    // Add a notes icon if notes are not empty
    const notesIcon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    notesIcon.setAttribute('href', './icons/note.png');
    notesIcon.setAttribute('x', 140 - 24); // Position to the bottom right
    notesIcon.setAttribute('y', 70 - 24);
    notesIcon.setAttribute('width', 20);
    notesIcon.setAttribute('height', 20);
    notesIcon.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent the click from propagating
      viewNotes(name);
    });
    roomGroup.appendChild(notesIcon);
  }


  // Check if notes exist for this room and show the icon if they do
  updateNotesIconVisibility(name);



  // the indicator

  const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  indicator.setAttribute('href', './icons/thisischris.svg'); //a proper explorer
  indicator.setAttribute('x', 140 - 32); 
  indicator.setAttribute('y', 1);        
  indicator.setAttribute('width', 38);
  indicator.setAttribute('height', 28);
  indicator.style.display = 'none'; 
  roomGroup.appendChild(indicator);


 //appending the room to the svg


  mapSvg.appendChild(roomGroup);
  roomElements[name] = roomGroup;

  const tooltip = document.createElement('div');
  tooltip.setAttribute('id', 'tooltip');
  tooltip.style.position = 'absolute';
  tooltip.style.background   = 'rgba(0, 0, 0, 0.7)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px';
  tooltip.style.borderRadius = '3px';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  enableDrag(roomGroup, name);

  //console.log(`Created room "${name}" at position: x=${x}, y=${y}, z=${z}`);
}


/*
  Manual connection creation
  */

// Start the connection creation process
function startConnection(roomName) {
  isCreatingConnection = true;
  sourceRoom = roomName;
  cancelLineCreationButton.style.display = 'block'; // Show the cancel button
  //console.log(`Starting connection from room: ${sourceRoom}`);
}

// Cancel connection creation
cancelLineCreationButton.addEventListener('click', () => {
  isCreatingConnection = false;
  sourceRoom = null;
  cancelLineCreationButton.style.display = 'none'; // Hide the cancel button
  //console.log('Connection creation canceled');
});

// Add event listener to handle room click for connection creation
mapSvg.addEventListener('click', (event) => {
  if (isCreatingConnection) {
    let targetRoom = null;
    
    // Loop through roomElements to find the clicked room
    for (const roomName in roomElements) {
      const roomGroup = roomElements[roomName];
      const bbox = roomGroup.getBoundingClientRect(); // Use getBoundingClientRect for more accurate detection

      if (
        event.clientX >= bbox.left && event.clientX <= bbox.right &&
        event.clientY >= bbox.top && event.clientY <= bbox.bottom
      ) {
        targetRoom = roomName; // The clicked room
        break;
      }
    }

    if (targetRoom && targetRoom !== sourceRoom) {
      // If a valid target room is found and it's not the source room, draw the connection
      drawLine(sourceRoom, targetRoom);
      //console.log(`Created connection between ${sourceRoom} and ${targetRoom}`);
    } 
    // else {
    //   console.log("No valid target room found or trying to connect a room to itself.");
    // }

    // End the connection creation process
    isCreatingConnection = false;
    sourceRoom = null;
    cancelLineCreationButton.style.display = 'none'; // Hide the cancel button
  }
});



/*
  Dragging logic
 */
function enableDrag(roomGroup, roomName) {
  let startX, startY, initialX, initialY;
  let isDraggingRoom = false;
  let viewBoxWidth, viewBoxHeight;

  roomGroup.addEventListener('mousedown', (event) => {
    event.preventDefault();
    startX = event.clientX;
    startY = event.clientY;
    isDraggingRoom = true;

    const transform = roomGroup.getAttribute('transform');
    [initialX, initialY] = transform
      .match(/translate\((.*),(.*)\)/)
      .slice(1, 3)
      .map(Number);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // mousedown event to mapSvg for panning
  mapSvg.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (event.target === mapSvg) { // Only pan if clicking on the map background
      startX = event.clientX;
      startY = event.clientY;
      isDraggingRoom = false;

      let [viewBoxMinX, viewBoxMinY, vbWidth, vbHeight] = mapSvg
        .getAttribute('viewBox')
        .split(' ')
        .map(Number);
      initialX = viewBoxMinX;
      initialY = viewBoxMinY;
      viewBoxWidth = vbWidth;
      viewBoxHeight = vbHeight;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  });

  function onMouseMove(event) {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (isDraggingRoom) {
      const roomSpacing = calculateDynamicRoomSpacing();
      const quarterSpacing = roomSpacing / 4; // Calculate a quarter of the room spacing

      const newX = initialX + Math.round(dx / quarterSpacing) * quarterSpacing;
      const newY = initialY + Math.round(dy / quarterSpacing) * quarterSpacing;

      roomGroup.setAttribute('transform', `translate(${newX}, ${newY})`);
      roomPositions[roomName] = { ...roomPositions[roomName], x: newX, y: newY };

      updateConnectionLines();
    } else {
      // Panning the map
      const newViewBoxMinX = initialX - dx;
      const newViewBoxMinY = initialY - dy;

      mapSvg.setAttribute('viewBox', `${newViewBoxMinX} ${newViewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);
    }
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}


// Function to move the current room indicator
function moveIndicator(roomName, createConnection = true) {
  if (currentRoom) {
    const currentIndicator = roomElements[currentRoom].querySelector('image'); // find chris
    currentIndicator.style.display = 'none'; // Hide the current room's indicator

    if (createConnection) {
      drawLine(currentRoom, roomName);
    }
  }

  if (roomElements[roomName]) {
    const newIndicator = roomElements[roomName].querySelector('image');
    newIndicator.style.display = 'inline'; // Show the new room's indicator
    currentRoom = roomName; // Set the new room as the current room

    scrollToCenterRoom(); // Center the map around the new current room
  }
}


// Function to check if a room overlaps with existing rooms
function checkOverlap(x, y, excludedRoom = null) {
  for (const roomName in roomElements) {
      if (roomName === excludedRoom) continue;

      const roomGroup = roomElements[roomName];
      const bbox = roomGroup.getBBox(); // Get the bounding box of the group

      if (
          x < bbox.x + bbox.width &&
          x + 140 > bbox.x &&
          y < bbox.y + bbox.height &&
          y + 70 > bbox.y
      ) {
          return true; 
      }
  }
  return false;
}


let drawnLines = []; // Array to store the drawn lines

function drawConnection(fromPos, toPos, connectionId) {


  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const hitboxLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');

  let x1, y1, x2, y2;
  const roomWidth = 140;
  const roomHeight = 70;

  if (toPos.x < fromPos.x) { // new room to the left
    x1 = fromPos.x;
    y1 = fromPos.y + (roomHeight / 2);
    x2 = toPos.x + roomWidth;
    y2 = toPos.y + (roomHeight / 2);
  } else if (toPos.x > fromPos.x) { // new room to the right
    x1 = fromPos.x + roomWidth;
    y1 = fromPos.y + (roomHeight / 2);
    x2 = toPos.x;
    y2 = toPos.y + (roomHeight / 2);
  } else if (toPos.y < fromPos.y) { // new room above
    x1 = fromPos.x + (roomWidth / 2);
    y1 = fromPos.y;
    x2 = toPos.x + (roomWidth / 2);
    y2 = toPos.y + roomHeight;
  } else if (toPos.y > fromPos.y) { // new room below
    x1 = fromPos.x + (roomWidth / 2);
    y1 = fromPos.y + roomHeight;
    x2 = toPos.x + (roomWidth / 2);
    y2 = toPos.y;
  }

  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);
  line.setAttribute('stroke', 'black');
  line.setAttribute('stroke-width', 2);
  line.setAttribute('data-connection-id', connectionId);

  // Creating a hitbox for wider line click detection
  hitboxLine.setAttribute('x1', x1);
  hitboxLine.setAttribute('y1', y1);
  hitboxLine.setAttribute('x2', x2);
  hitboxLine.setAttribute('y2', y2);
  hitboxLine.setAttribute('stroke', 'transparent');
  hitboxLine.setAttribute('stroke-width', 20); // Larger hitbox for clicking
  hitboxLine.setAttribute('cursor', 'pointer');

  // event listener for deleting the line on click
  hitboxLine.addEventListener('click', () => {
    mapSvg.removeChild(line);
    mapSvg.removeChild(hitboxLine);

    // Remove the connection from the drawnLines array and the connections object
    drawnLines = drawnLines.filter(item => item.connectionId !== connectionId);
    for (const layer in connections) {
      for (const key in connections[layer]) {
        if (connections[layer][key] === connectionId) {
          delete connections[layer][key];
          break;
        }
      }
    }
    //console.log(`Connection ${connectionId} deleted.`);
  });

  // Append the hitbox and line to the SVG
  mapSvg.appendChild(hitboxLine);
  mapSvg.appendChild(line);
  

  drawnLines.push({ connectionId, line }); // Update drawnLines with only line information
}



// Function to draw a line between two rooms
function drawLine(fromRoom, toRoom) {
  if (fromRoom === toRoom) {
    return;
  }

  const fromPos = roomPositions[fromRoom];
  const toPos = roomPositions[toRoom];

  if (fromPos && toPos && fromPos.z === toPos.z) {
    const connectionKey = `${fromRoom}_${toRoom}`;
    const reverseConnectionKey = `${toRoom}_${fromRoom}`;
    const layerConnections = connections[fromPos.z.toString()];

    let connectionId = null;
    for (const layer in connections) {
      if (connections[layer][connectionKey] || connections[layer][reverseConnectionKey]) {
        connectionId = connections[layer][connectionKey] || connections[layer][reverseConnectionKey];
        break;
      }
    }

    if (!connectionId) {
      connectionId = `${fromRoom.substring(0, 3)}${toRoom.substring(0, 3)}`;

      //included storing exact info for diagonal connections
      let direction;
      if (toPos.x > fromPos.x && toPos.y === fromPos.y) {
        direction = "east";
      } else if (toPos.x < fromPos.x && toPos.y === fromPos.y) {
        direction = "west";
      } else if (toPos.y > fromPos.y && toPos.x === fromPos.x) {
        direction = "south";
      } else if (toPos.y < fromPos.y && toPos.x === fromPos.x) {
        direction = "north";
      } else if (toPos.x > fromPos.x && toPos.y < fromPos.y) {
        direction = "northeast";
      } else if (toPos.x < fromPos.x && toPos.y < fromPos.y) {
        direction = "northwest";
      } else if (toPos.x > fromPos.x && toPos.y > fromPos.y) {
        direction = "southeast";
      } else {
        direction = "southwest";
      }

      layerConnections[connectionKey] = { id: connectionId, direction };
      //console.log(`New connection ${connectionId} created between ${fromRoom} and ${toRoom} on layer ${fromPos.z} in direction ${direction}`);
    }

    if (fromPos.z === currentLayer) {
      drawConnection(fromPos, toPos, connectionId);
    }
  }
}

  //travel to room function
  function travelToRoom(roomName) {
    if (!roomElements[roomName]) {
      console.warn(`Room "${roomName}" does not exist.`);
      return;
    }
  
    if (roomName !== currentRoom) {
      const path = findShortestPath(currentRoom, roomName);
      if (path) {
        const directions = getPathDirections(path).split(", ");
        //console.log(`Shortest path to ${roomName}: ${directions}`);

  
        const combinedDirections = directions.join(", ");
       // console.log(`Combined directions: ${combinedDirections}`);

  
        const inputField = document.querySelector('#windowport input[type="text"]');
  
        if (inputField) {
          inputField.focus();
  

          inputField.value = combinedDirections;
  
          // Dispatch 'input' event to notify the input field has changed
          inputField.dispatchEvent(new Event('input', { bubbles: true }));
  
          /*glkote doesn't like the 'Enter' keydown sim so we sim a keypress. renderer.js's MQI function worked for keydown Enter
          and even after adding logic to understand the Enter keypress , the only way to make it work was to have a keydown and a keypress
          go off simultaneously*/
          const keypressEvent = $.Event("keypress", { which: 13 });
          $(inputField).trigger(keypressEvent);
  
          const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
          inputField.dispatchEvent(keydownEvent);
  
          //console.log(`Sent combined directions to Quixe: ${combinedDirections}`);
        } else {
          console.warn("Quixe input field not found.");
        }
      } else {
        console.log(`No path found to ${roomName}`);
      }
    }
  
    // Move the current room indicator to the selected room
    moveIndicator(roomName, false); // No need to create a connection when traveling, it's mostly for backtracking
    currentRoom = roomName;
    //console.log(`Traveled to room: ${roomName}`);
  }
  
  


  
// In-memory storage for notes
const roomNotes = {};

// Show notes for a room
function showNotes(roomName) {
  const notesWindow = window.open('', 'Notes', 'width=400,height=300,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=no');
  notesWindow.document.write(`
    <html>
    <head>
      <title>Notes for ${roomName}</title>
      <style>
        body {
          font-family: Georgia, sans-serif;
          background-color: #94abbd;
          margin: 0;
          padding: 20px;
          overflow: hidden;

    &::-webkit-scrollbar { 
        display: none; 
    }

    -ms-overflow-style: none;  
    scrollbar-width: none; 
        }
        h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        textarea {
          width: 100%;
          height: 150px;
          font-family: Georgia, sans-serif;
          font-style: italic;
          font-size: 15px;
          padding: 10px;
          background-color: #f5ee8c;
          border-radius: 12px;
          border: 1px solid #ccc;
          box-sizing: border-box;
          resize: none;
          overflow: hidden;

    &::-webkit-scrollbar { 
        display: none; 
    }

    -ms-overflow-style: none;  
    scrollbar-width: none; 
        }
        button {
          color: black;
          padding: 10px 20px;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          margin-top: 10px;
          margin-right: 10px;
        }
        button:hover {
          background-color: white;
        }
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <textarea id="notesTextarea"></textarea>
      <div class="button-container">
        <button id="saveNotesButton">Save Notes</button>
        <button id="closeButton">Close</button>
      </div>
    </body>
    </html>
  `);

  const notesTextarea = notesWindow.document.getElementById('notesTextarea');
  const saveNotesButton = notesWindow.document.getElementById('saveNotesButton');
  const closeButton = notesWindow.document.getElementById('closeButton');

  // Load existing notes from in-memory storage (if available)
  const storedNotes = roomNotes[roomName] || '';
  notesTextarea.value = storedNotes;

  saveNotesButton.addEventListener('click', () => {
    const newNotes = notesTextarea.value;
    roomNotes[roomName] = newNotes; // Save notes in memory
    updateNotesIconVisibility(roomName);
    notesWindow.close();
  });
  

  closeButton.addEventListener('click', () => {
    notesWindow.close();
  });
}

function updateNotesIconVisibility(roomName) {
  const roomGroup = roomElements[roomName];
  if (!roomGroup) return;

  const existingIcon = roomGroup.querySelector('image[href="./icons/note.png"]');
  const notes = roomNotes[roomName];
  
  if (notes && notes.trim() !== '') {
    if (!existingIcon) {
      // If no icon exists and notes are present, add the icon
      const notesIcon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      notesIcon.setAttribute('href', './icons/note.png');
      notesIcon.setAttribute('x', 140 - 24); // Position to the bottom right
      notesIcon.setAttribute('y', 70 - 24);
      notesIcon.setAttribute('width', 20);
      notesIcon.setAttribute('height', 20);
      notesIcon.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating
        viewNotes(roomName);
      });
      roomGroup.appendChild(notesIcon);
    }
  } else if (existingIcon) {
    // If the icon exists but notes are empty, remove the icon
    existingIcon.remove();
  }
}




function viewNotes(roomName) {
  // Close any existing note viewers
  const existingViewer = document.getElementById('notesViewer');
  if (existingViewer) existingViewer.remove();

  // Create a new notes viewer
  const notesViewer = document.createElement('div');
  notesViewer.setAttribute('id', 'notesViewer');
  notesViewer.style.position = 'absolute';
  notesViewer.style.backgroundColor = 'rgba(248, 249, 99, 0.8)';
  notesViewer.style.color = 'black';
  notesViewer.style.padding = '20px';
  notesViewer.style.borderRadius = '8px';
  notesViewer.style.maxWidth = '300px';
  notesViewer.style.zIndex = '1000';
  notesViewer.style.top = '50%';
  notesViewer.style.left = '50%';
  notesViewer.style.transform = 'translate(-50%, -50%)';
  notesViewer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  notesViewer.style.fontFamily = 'Georgia, sans-serif';
  notesViewer.style.fontSize = '15px'; 


  // Display room name and notes
  const title = document.createElement('h3');
  title.textContent = `Notes for ${roomName}`;
  title.style.marginTop = '0';

  const notesText = document.createElement('p');
  notesText.textContent = roomNotes[roomName] || 'No notes available.';
  notesText.style.marginBottom = '0';

  notesViewer.appendChild(title);
  notesViewer.appendChild(notesText);

  document.body.appendChild(notesViewer);

  // close the viewnotes box when the user clicks outside of it
  document.addEventListener('click', (event) => {
    if (!notesViewer.contains(event.target)) {
      notesViewer.remove();
    }
  }, { once: true });
}


//This function moves the indicator to a room nothing more (mainly for the case we create the room ourselves)
function manualIndicatorMove(roomName) {
  if (!roomElements[roomName]) {
    console.warn(`Room "${roomName}" does not exist.`);
    return;
  }

  // Move the current room indicator to the selected room
  moveIndicator(roomName,false);

  // Set the selected room as the current room
  currentRoom = roomName;

 // console.log(`Moved to room: ${roomName}`);
}


// Function to delete a room
function deleteRoom(roomName) {
  if (roomElements[roomName]) {
      // Remove the room's SVG element
      mapSvg.removeChild(roomElements[roomName]);

      // Remove from data structures
      delete roomElements[roomName];
      delete roomPositions[roomName];

      // Remove connections associated with the room
      for (const layer in connections) {
          const layerConnections = connections[layer];
          for (const connectionKey in layerConnections) {
              if (connectionKey.includes(roomName)) {
                  delete layerConnections[connectionKey];
              }
          }
      }

      if (currentRoom === roomName) {
          currentRoom = null; 
      }

      // Redraw connection lines to reflect the changes
      updateConnectionLines();

     // console.log(`Room "${roomName}" deleted`);
  } else {
      console.warn(`Room "${roomName}" not found for deletion`);
  }
}




// Normalize user input to full direction names
function normalizeDirection(input) {
  const directionMap = {
    'n': 'north',
    'north': 'north',
    'move n': 'north',
    'move north': 'north',
    'travel n': 'north',
    'travel north': 'north',
    'go n': 'north',
    'go north': 'north',
    's': 'south',
    'south': 'south',
    'go s': 'south',
    'go south': 'south',
    'w': 'west',
    'west': 'west',
    'go w': 'west',
    'go west': 'west',
    'e': 'east',
    'east': 'east',
    'go e': 'east',
    'go east': 'east',
    'ne': 'northeast',
    'northeast': 'northeast',
    'go ne': 'northeast',
    'go northeast': 'northeast',
    'nw': 'northwest',
    'northwest': 'northwest',
    'go nw': 'northwest',
    'go northwest': 'northwest',
    'se': 'southeast',
    'southeast': 'southeast',
    'go se': 'southeast',
    'go southeast': 'southeast',
    'sw': 'southwest',
    'southwest': 'southwest',
    'go sw': 'southwest',
    'go southwest': 'southwest',
    'u': 'up',
    'go up': 'up',
    'up': 'up',
    'move up': 'up',
    'climb up': 'up',
    'climb up ladder': 'up',
    'climb up tree': 'up',
    'climb up pipe': 'up',
    'd': 'down',
    'down': 'down',
    'go down': 'down',
    'move down': 'down',
    'climb down': 'down',
    'climb down ladder': 'down',
    'climb down tree': 'down',
    'climb down pipe': 'down',
    'inside': 'inside',
    'in': 'inside',
    'go in': 'inside',
    'inward': 'inside',
    'inwards': 'inside',
    'go inward': 'inside',
    'go inwards': 'inside',
    'go inside': 'inside',
    'enter': 'inside',
    'outside': 'outside',
    'out': 'outside',
    'go out': 'outside',
    'outward': 'outside',
    'outwards': 'outside',
    'go outward': 'outside',
    'go outwards': 'outside',
    'go outside': 'outside',
    'exit': 'outside'
  };
  // If the input doesn't match any key in the map, default to 'south'
  return directionMap[input.trim().toLowerCase()] || 'south';
}



function calculateDynamicRoomSpacing() {
  const standardRoomSpacing = 200; // Minimum standard spacing
  let maxRoomHeight = 0;
  for (const roomName in roomElements) {
    const room = roomElements[roomName];
    const roomHeight = room.offsetHeight;
    if (roomHeight > maxRoomHeight) {
      maxRoomHeight = roomHeight;
    }
  }
  const calculatedSpacing = maxRoomHeight + 40; 
  return Math.max(standardRoomSpacing, calculatedSpacing); // Ensure minimum spacing
}

// Function to update room positions when a new room is created in a specific direction.
function updateRoomPositions(newRoomPos, direction) {
  const roomSpacing = calculateDynamicRoomSpacing();
  let roomsShifted = false; // Flag to track if any rooms were shifted

  // Get the current layer's rooms
  const currentLayerRooms = Object.keys(roomPositions).filter(
      roomName => roomPositions[roomName].z === newRoomPos.z
  );

  if (direction === 'north') {
      // Check if the new room overlaps with any existing room on the current layer
      const overlappingRoomExists = currentLayerRooms.some(
          roomName => roomPositions[roomName].x === newRoomPos.x &&
                      roomPositions[roomName].y === newRoomPos.y
      );

      if (overlappingRoomExists) {
          roomsShifted = true; // Set the flag if rooms were shifted
          // Shift all rooms at or above the new room's y-coordinate northward
          for (const roomName of currentLayerRooms) {
              if (roomName === currentRoom) continue; // Skip the current room
              const otherRoomPos = roomPositions[roomName];
              if (otherRoomPos.y <= newRoomPos.y) {
                  otherRoomPos.y -= roomSpacing;
                  roomElements[roomName].setAttribute(
                      "transform",
                      `translate(${otherRoomPos.x}, ${otherRoomPos.y})`
                  );
                  // console.log(
                  //     `Shifted room "${roomName}" to x=${otherRoomPos.x}, y=${otherRoomPos.y} in layer ${newRoomPos.z}`
                  // );
              }
          }
      }
  } else if (direction === 'west') {
      // Check if the new room overlaps with any existing room on the current layer
      const overlappingRoomExists = currentLayerRooms.some(
          roomName => roomPositions[roomName].x === newRoomPos.x &&
                      roomPositions[roomName].y === newRoomPos.y
      );

      if (overlappingRoomExists) {
          roomsShifted = true; // Set the flag if rooms were shifted
          // Shift all rooms at or to the left of the new room's x-coordinate westward
          for (const roomName of currentLayerRooms) {
              if (roomName === currentRoom) continue; // Skip the current room
              const otherRoomPos = roomPositions[roomName];
              if (otherRoomPos.x <= newRoomPos.x) {
                  otherRoomPos.x -= roomSpacing;
                  roomElements[roomName].setAttribute(
                      "transform",
                      `translate(${otherRoomPos.x}, ${otherRoomPos.y})`
                  );
                  console.log(
                      `Shifted room "${roomName}" to x=${otherRoomPos.x}, y=${otherRoomPos.y} in layer ${newRoomPos.z}`
                  );
              }
          }
      }
  } else if (direction === 'east') {
      // Check if the new room overlaps with any existing room on the current layer
      const overlappingRoomExists = currentLayerRooms.some(
          roomName => roomPositions[roomName].x === newRoomPos.x &&
                      roomPositions[roomName].y === newRoomPos.y
      );

      if (overlappingRoomExists) {
          roomsShifted = true; // Set the flag if rooms were shifted
          // Shift all rooms at or to the right of the new room's x-coordinate eastward
          for (const roomName of currentLayerRooms) {
              if (roomName === currentRoom) continue; // Skip the current room
              const otherRoomPos = roomPositions[roomName];
              if (otherRoomPos.x >= newRoomPos.x) {
                  otherRoomPos.x += roomSpacing;
                  roomElements[roomName].setAttribute(
                      "transform",
                      `translate(${otherRoomPos.x}, ${otherRoomPos.y})`
                  );
                  console.log(
                      `Shifted room "${roomName}" to x=${otherRoomPos.x}, y=${otherRoomPos.y} in layer ${newRoomPos.z}`
                  );
              }
          }
      }
  } else if (direction === 'south') {
      // Check if the new room overlaps with any existing room on the current layer
      const overlappingRoomExists = currentLayerRooms.some(
          roomName => roomPositions[roomName].x === newRoomPos.x &&
                      roomPositions[roomName].y === newRoomPos.y
      );

      if (overlappingRoomExists) {
          roomsShifted = true; // Set the flag if rooms were shifted
          // Shift all rooms at or below the new room's y-coordinate southward
          for (const roomName of currentLayerRooms) {
              if (roomName === currentRoom) continue; // Skip the current room
              const otherRoomPos = roomPositions[roomName];
              if (otherRoomPos.y >= newRoomPos.y) {
                  otherRoomPos.y += roomSpacing;
                  roomElements[roomName].setAttribute(
                      "transform",
                      `translate(${otherRoomPos.x}, ${otherRoomPos.y})`
                  );
                  console.log(
                      `Shifted room "${roomName}" to x=${otherRoomPos.x}, y=${otherRoomPos.y} in layer ${newRoomPos.z}`
                  );
              }
          }
      }
  }

  // If rooms were shifted, update the connection lines for the current layer
  if (roomsShifted) {
      updateConnectionLines();
  }
}

function updateConnectionLines() {
    // Remove all existing connection lines
    const allLines = mapSvg.querySelectorAll('line');
    allLines.forEach(line => mapSvg.removeChild(line));

    // Redraw connections for the current layer, considering the updated room positions
    for (const connectionKey in connections[currentLayer.toString()]) {
        const [fromRoom, toRoom] = connectionKey.split('_');
        drawLine(fromRoom, toRoom); 
    }
}


// Event listener for receiving detected room

receive('detectedRoom', (newRoom) => {

  if (newRoom && Object.keys(roomElements).length === 1) {
    // Enable Intelligent Travel option once the first room is detected
    const menu = document.getElementById('contextMenu');
    if (menu && !menu.querySelector('[data-option="intelligentTravel"]')) {
        const intelligentTravelOption = document.createElement('div');
        intelligentTravelOption.textContent = 'Intelligent Travel';
        intelligentTravelOption.style.padding = '5px';
        intelligentTravelOption.style.cursor = 'pointer';
        intelligentTravelOption.setAttribute('data-option', 'intelligentTravel');
        intelligentTravelOption.addEventListener('click', () => {
            startAgentExploration();  // Start exploring automatically
            menu.remove();  // Close the context menu
        });
        menu.appendChild(intelligentTravelOption);
    }
}


  if (commaOrPeriodBetweenDirections) {
    // console.log('Comma between directions detected, returning early from detected room');
    return;
  }




  // If we're currently in a room, draw a connection to the new room
  if (currentRoom) {
     // Check if the new room was detected without explicit user input
     const lastDirection = roomElements[currentRoom].getAttribute('data-direction');
     if (!lastDirection) {
     // If no direction was recorded, assume "south"
    // console.log(`Assuming "south" direction for new room ${newRoom}`);
    roomElements[currentRoom].setAttribute('data-direction', 'south');
     }
    
     drawLine(currentRoom, newRoom);
     }
    

  // Check if the new room already exists on the map
  if (roomElements[newRoom]) {
    // If it exists, simply move the current room indicator to it
    moveIndicator(newRoom,true);
  } else {
    // This is a brand new room, so we need to calculate its position on the map
    let x, y, z = currentLayer; // New rooms are always placed on the current layer

    // x and y for first room or manual room
    if (!currentRoom) {
      x = 500; 
      y = 500; 
    } else {
      const prevRoomPos = roomPositions[currentRoom];
      const direction = roomElements[currentRoom].getAttribute('data-direction');
      const dynamicRoomSpacing = calculateDynamicRoomSpacing();
// Calculate tentative position for the new room
let tentativeX = prevRoomPos.x; 
let tentativeY = prevRoomPos.y;

switch(direction) {
  case 'north': tentativeY -= dynamicRoomSpacing; break;

  case 'south': tentativeY += dynamicRoomSpacing; break;

  case 'east':  tentativeX += dynamicRoomSpacing; break;

  case 'west':  tentativeX -= dynamicRoomSpacing; break;

  case 'northwest':
    tentativeX -= dynamicRoomSpacing;
    tentativeY -= dynamicRoomSpacing;
    break;
  case 'northeast':
    tentativeX += dynamicRoomSpacing;
    tentativeY -= dynamicRoomSpacing;
    break;
  case 'southwest':
    tentativeX -= dynamicRoomSpacing;
    tentativeY += dynamicRoomSpacing;
    break;
  case 'southeast':
    tentativeX += dynamicRoomSpacing;
    tentativeY += dynamicRoomSpacing;
    break;
  case 'up':
    z = prevRoomPos.z + 1; // move to the layer above
    break;
  case 'down':
    z = prevRoomPos.z - 1; // move to the layer below
    break;
  case 'inside':
    tentativeX += dynamicRoomSpacing;
    break;
  case 'outside':
    tentativeX -= dynamicRoomSpacing;
    break;
}

// Update room positions based on the tentative new room position
updateRoomPositions({ x: tentativeX, y: tentativeY, z }, direction);

// Recalculate the final position for the new room, considering the shifted rooms
x = tentativeX;
y = tentativeY;
while(checkOverlap(x, y)) {
  switch(direction) {
    case 'north': y -= 10; break; // Adjust by a smaller increment to avoid large gaps
    case 'south': y += 10; break;
    case 'east':  x += 10; break;
    case 'west':  x -= 10; break;
    // Handle other directions similarly if needed
    case 'northwest':
      x -= 10;
      y -= 10;
      break;
    case 'northeast':
      x += 10;
      y -= 10;
      break;
    case 'southwest':
      x -= 10;
      y += 10;
      break;
    case 'southeast':
      x += 10;
      y += 10;
      break;
    case 'up':
    case 'down':
    case 'inside':
    case 'outside':
      // For these directions, no adjustment is needed after `updateRoomPositions`
      break;
  }
}
    

      // If we haven't adjusted the y-coordinate yet (no close rooms above/below)...
      if (y === undefined) {
        switch (direction) {
          case 'north':
            y = prevRoomPos.y - dynamicRoomSpacing; 
            break;
          case 'south':
            y = prevRoomPos.y + dynamicRoomSpacing;
            break;
          case 'west':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          case 'east':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          case 'northwest':
            y = prevRoomPos.y - dynamicRoomSpacing;
            break;
          case 'northeast':
            y = prevRoomPos.y - dynamicRoomSpacing;
            break;
          case 'southwest':
            y = prevRoomPos.y + dynamicRoomSpacing;
            break;
          case 'southeast':
            y = prevRoomPos.y + dynamicRoomSpacing;
            break;
          case 'up':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          case 'down':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          case 'inside':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          case 'outside':
            y = prevRoomPos.y; // Keep the same y-coordinate as the previous room
            break;
          /*default:
            console.warn("Invalid direction:", direction);
            return;*/
        }
      }

      // If we haven't adjusted the x-coordinate yet (no close rooms to the left/right)...
      if (x === undefined) {
        switch (direction) {
          case 'north':
            x = prevRoomPos.x; // Keep the same x-coordinate as the previous room
            break;
          case 'south':
            x = prevRoomPos.x; // Keep the same x-coordinate as the previous room
            break;
          case 'west':
            x = prevRoomPos.x - dynamicRoomSpacing;
            break;
          case 'east':
            x = prevRoomPos.x + dynamicRoomSpacing;
            break;
          case 'northwest':
            x = prevRoomPos.x - dynamicRoomSpacing; 
            break;
          case 'northeast':
            x = prevRoomPos.x + dynamicRoomSpacing; 
            break;
          case 'southwest':
            x = prevRoomPos.x - dynamicRoomSpacing;
            break;
          case 'southeast':
            x = prevRoomPos.x + dynamicRoomSpacing;
            break;
          case 'up':
            x = prevRoomPos.x; // Keep the same x-coordinate as the previous room
            break;
          case 'down':
            x = prevRoomPos.x; // Keep the same x-coordinate as the previous room
            break;
          case 'inside':
            x = prevRoomPos.x + dynamicRoomSpacing;
            break;
          case 'outside':
            x = prevRoomPos.x - dynamicRoomSpacing;
            break;
         /* default:
            console.warn("Invalid direction:", direction);
            return;*/
        }
      }

      // Now, handle the main directions and calculate the final x and y coordinates
      switch (direction) {
        case 'north':
          x = prevRoomPos.x; // y is already calculated
          break;
        case 'south':
          x = prevRoomPos.x; // y is already calculated
          break;
        case 'west':
          // x and y are already calculated
          break;
        case 'east':
          // x and y are already calculated
          break;
        case 'northwest':
          x = prevRoomPos.x - dynamicRoomSpacing; 
          // y is already calculated
          break;
        case 'northeast':
          x = prevRoomPos.x + dynamicRoomSpacing; 
          // y is already calculated
          break;
        case 'southwest':
          x = prevRoomPos.x - dynamicRoomSpacing;
          // y is already calculated
          break;
        case 'southeast':
          x = prevRoomPos.x + dynamicRoomSpacing;
          // y is already calculated
          break;
        case 'up':
          z = prevRoomPos.z + 1; // Move to the layer above
          x = prevRoomPos.x;
          y = prevRoomPos.y;
          break;
        case 'down':
          z = prevRoomPos.z - 1; // Move to the layer below
          x = prevRoomPos.x;
          y = prevRoomPos.y;
          break;
        case 'inside':
          x = prevRoomPos.x + dynamicRoomSpacing;
          y = prevRoomPos.y;
          break;
        case 'outside':
          x = prevRoomPos.x - dynamicRoomSpacing;
          y = prevRoomPos.y;
          break;
        /*default:
          console.error("Invalid direction:", direction);
          return;*/
      }
    }
    expandMapIfNeeded(x, y); 

    // console.log the calculated position to the dev tools
    //console.log(`Calculated position for ${newRoom}: x=${x}, y=${y}, z=${z}`);

    // Create the new room element and add it to the map
    createRoom(newRoom, x, y, z);
    // Store the room's position for future reference
    roomPositions[newRoom] = { x, y, z };

    // If the new room is on a different layer  update the current layer and redraw the map
    if (currentLayer !== z) {
      currentLayer = z;
      document.getElementById('layerToggle').value = currentLayer;
      switchLayer(currentLayer);
    }

    // Finally, move the current room indicator to the new room
    moveIndicator(newRoom,true);
  }
});

let commaOrPeriodBetweenDirections = false;  

const validDirections = ['north', 'south', 'east', 'west','northwest','northeast','southwest','southeast', 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'up', 'down'];

// Check if all parts of the input are valid directions
function areAllDirections(parts) {
  return parts.every(part => validDirections.includes(part.trim().toLowerCase()));
}

// Event listener for receiving user input
receive('userInput', (input) => {

  if (/[,.]/.test(input)) {
    // Split input by commas or periods
    const parts = input.split(/[,.]/);

    // Check if all parts are valid directions
    if (parts.length >= 2 && areAllDirections(parts)) {
      //console.log('Comma or period between valid directions detected, setting flag');
      commaOrPeriodBetweenDirections = true;  // Set flag if the input contains valid directions
    } else {
      commaOrPeriodBetweenDirections = false;
    }
  } else {
    commaOrPeriodBetweenDirections = false;
  }


  const normalizedInput = normalizeDirection(input);
  if (currentRoom) {
    roomElements[currentRoom].setAttribute('data-direction', normalizedInput);
  }
  //console.log(`User input: ${input} normalized to: ${normalizedInput}`);
  
  // Handle layer change for "up" and "down" directions
  if (normalizedInput === 'up' && currentRoom) {
    const prevRoomPos = roomPositions[currentRoom];
    const newLayer = prevRoomPos.z + 1;
    if (newLayer !== currentLayer) {
      currentLayer = newLayer;
      document.getElementById('layerToggle').value = currentLayer;
      switchLayer(currentLayer);
    }
  } else if (normalizedInput === 'down' && currentRoom) {
    const prevRoomPos = roomPositions[currentRoom];
    const newLayer = prevRoomPos.z - 1;
    if (newLayer !== currentLayer) {
      currentLayer = newLayer;
      document.getElementById('layerToggle').value = currentLayer;
      switchLayer(currentLayer);
    }
  }
});


// Scroll the map to center the current room
function scrollToCenterRoom() {
  if (currentRoom && roomPositions[currentRoom]) {
      const roomPos = roomPositions[currentRoom];
      
      // Calculate the center of the room relative to the entire map
      const roomCenterX = roomPos.x + 70; // 70 is half the room's width
      const roomCenterY = roomPos.y + 35; // 35 is half the room's height

      // Calculate the scroll offsets needed to center the room
      const targetScrollX = roomCenterX - (mapContainer.clientWidth / 2);
      const targetScrollY = roomCenterY - (mapContainer.clientHeight / 2);

      // Adjust the scroll position to center the room
      mapContainer.scrollTo({
          left: targetScrollX,
          top: targetScrollY,
      });

      //console.log(`Scrolling to center room "${currentRoom}" at: x=${roomCenterX}, y=${roomCenterY}`);
     // console.log('Scroll offsets:', targetScrollX, targetScrollY);
  }
}


// Function to switch between layers
function switchLayer(layer) {
    let layerChanged = currentLayer !== layer;

    for (const roomName in roomElements) {
        const roomGroup = roomElements[roomName];
        roomGroup.setAttribute('visibility', roomPositions[roomName].z === layer ? 'visible' : 'hidden'); 
    }

// Remove all connection lines from the SVG
const allLines = mapSvg.querySelectorAll('line');
allLines.forEach(line => mapSvg.removeChild(line));

// Redraw connections only for the current layer
for (const connectionKey in connections[layer.toString()]) {
    const [fromRoom, toRoom] = connectionKey.split('_');
    drawLine(fromRoom, toRoom);
}

    scrollToCenterRoom();
}




//toggle functionality to switch between layers from the menu
document.getElementById('layerToggle').addEventListener('change', (event) => {
  currentLayer = parseInt(event.target.value);
  switchLayer(currentLayer);
});





/*-------------------------MAP SAVING AND LOADING-----------------------------*/




const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');



saveButton.addEventListener('click', async () => {
  const mapData = {
      roomElements: {}, 
      connections,       
      detectedRooms,      
      currentLayer,
      notes: roomNotes        
  };

  // Populate roomElements with room data
  for (const roomName in roomElements) {
    const roomGroup = roomElements[roomName];
    const transform = roomGroup.getAttribute('transform');
    const [x, y] = transform.match(/translate\((.*),(.*)\)/).slice(1, 3).map(Number);
    const z = roomPositions[roomName].z;
    mapData.roomElements[roomName] = { x, y, z };
  }

// Stringify the mapData before saving
const mapDataJSON = JSON.stringify(mapData);

// Use saveMapToFile from preload.js
const saveSuccessful = await window.electronAPI.saveMapToFile(mapDataJSON);
if (saveSuccessful) {
  console.log('Map saved successfully!');
} else {
  console.log('Map save canceled or failed.');
}
});

// Load map data from file
loadButton.addEventListener('click', async () => {
  const loadedMapData = await window.electronAPI.loadMapFromFile();
  if (loadedMapData) {
    const mapData = JSON.parse(loadedMapData);

    // Clear the existing map
    clearMap();

        // Load notes into in-memory storage
        Object.assign(roomNotes, mapData.notes);

    // Recreate rooms and connections from loaded data
    for (const roomName in mapData.roomElements) {
      const { x, y, z } = mapData.roomElements[roomName];
      createRoom(roomName, x, y, z);
      roomPositions[roomName] = { x, y, z };
    }



    // Update connections and current layer
    for (const layer in mapData.connections) {
      connections[layer] = mapData.connections[layer];
    }
    currentLayer = mapData.currentLayer;
    document.getElementById('layerToggle').value = currentLayer;
    switchLayer(currentLayer);

    detectedRooms.length = 0; // Clear the existing array
    detectedRooms.push(...mapData.detectedRooms); // Add elements from the loaded data

    console.log('Map loaded successfully!');
  } else {
    console.log('Map load canceled or failed.');
  }
});

function clearMap() {

  const allLines = mapSvg.querySelectorAll('line');
  allLines.forEach(line => {
    mapSvg.removeChild(line);  // Remove the lines from the SVG
  });

  // Remove all room elements from the SVG
  for (const roomName in roomElements) {
    mapSvg.removeChild(roomElements[roomName]);
  }

  // Clear the contents of the existing objects
  for (const key in roomElements) {
    delete roomElements[key];
  }
  for (const key in roomPositions) {
    delete roomPositions[key];
  }

  // Clear connections
  for (const layer in connections) {
    connections[layer] = {};
  }


  currentRoom = null;
}

// Event listener for the Clear Map button

const clearMapButton = document.getElementById('clearMapButton');
clearMapButton.addEventListener('click', clearMap);




/* -------------------------QUICK TRAVEL BY USING BREADTH FIRST SEARCH-----------------------------*/ 



function getPathDirections(path) {
  const directions = [];
  const startLayer = roomPositions[path[0]].z;

  for (let i = 0; i < path.length - 1; i++) {
    const fromRoom = path[i];
    const toRoom = path[i + 1];
    const connectionKey = `${fromRoom}_${toRoom}`;
    const reverseConnectionKey = `${toRoom}_${fromRoom}`;
    const layerConnections = connections[startLayer.toString()];

    let connection = layerConnections[connectionKey];
    if (!connection) {
      connection = layerConnections[reverseConnectionKey];
      if (connection) {
        switch (connection.direction) {
          case "north":
            directions.push("south");
            break;
          case "south":
            directions.push("north");
            break;
          case "east":
            directions.push("west");
            break;
          case "west":
            directions.push("east");
            break;
          case "northeast":
            directions.push("southwest");
            break;
          case "northwest":
            directions.push("southeast");
            break;
          case "southeast":
            directions.push("northwest");
            break;
          case "southwest":
            directions.push("northeast");
            break;
        }
      }
    } else {
      directions.push(connection.direction);
    }
  }

  // if (directions.length === 0) {
  //   console.log("No valid path found between rooms.");
  // } else {
  //   console.log(`Calculated directions: ${directions.join(", ")}`);
  // }

  return directions.join(", ");
}



function findShortestPath(fromRoom, toRoom) {
 // console.log(`Finding path from ${fromRoom} to ${toRoom}`);
  const startLayer = roomPositions[fromRoom].z;
  const queue = [{ room: fromRoom, path: [fromRoom] }];
  const visited = new Set();

  while (queue.length > 0) {
    const { room, path } = queue.shift();
    //console.log(`Visiting room: ${room}, Path so far: ${path.join(" -> ")}`);
    visited.add(room);

    if (room === toRoom) {
      //console.log(`Found path: ${path.join(" -> ")}, Total cost: ${path.length - 1}`);
      return path;
    }

    const layerConnections = connections[startLayer.toString()];
    for (const connectionKey in layerConnections) {
      const [room1, room2] = connectionKey.split("_");

      let nextRoom = null;
      if (room1 === room) {
        nextRoom = room2;
      } else if (room2 === room) {
        nextRoom = room1;
      }

      if (nextRoom && !visited.has(nextRoom)) {
        queue.push({ room: nextRoom, path: [...path, nextRoom] });
      }
    }
  }

  //console.log("No path found.");
  return null;
}