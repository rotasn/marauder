const { openFile, invokeConvertFile, sendUserInput, sendDetectedRoom, runPythonRoomDetection } = window.electronAPI;




// Data Storage for Room Tracking
const detectedRooms = [];
let SUBHEADERTXT = [];
let NORMALTXT = [];
let lastUserCommand = "";
let exactMatchWords = ['yes','no'];
let a2z = 'abcdefghijklmnopqrstuvwxyz';
exactMatchWords = exactMatchWords.concat(a2z.split(''));




document.addEventListener('DOMContentLoaded', () => {

  
  const welcomeMessage = document.getElementById('welcomeMessage');
  const selectFileButton = document.getElementById('selectFileButton');
  const moreInfo = document.getElementById('moreInfo');
  const infoMessage = document.getElementById('infoMessage');
  const backButton = document.getElementById('backButton');
  const logoicon = document.getElementById('logo');



  function monitorTitleChanges() {
    const targetNode = document.querySelector('title');
    const config = { childList: true, subtree: true, characterData: true };
  
    const callback = (mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          let titleText = document.title;
          //remove " - Quixe" from the captured title
          if (titleText.endsWith(' - Quixe')) {
            titleText = titleText.replace(' - Quixe', '').trim();
          }
          
          // Add the cleaned title to exactMatchWords if not already added
          if (!exactMatchWords.includes(titleText)) {
            exactMatchWords.push(titleText);
            //console.log('Updated exactMatchWords:', exactMatchWords);
          }
        }
      }
    };
  
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
  }
  
  // Call function to monitor title changes
  monitorTitleChanges();



  // event listener for the wand
  selectFileButton.addEventListener('click', async () => {
  

    //  file selection
    const { canceled, filePaths } = await openFile();
    if (!canceled && filePaths && filePaths.length > 0) {

        // hide the welcome message and wand button
      welcomeMessage.style.display = 'none';
      selectFileButton.style.display = 'none';


      const filePath = filePaths[0];
      const fileName = filePath.split(/[/\\]/).pop();
      const fileBaseName = fileName.split('.').slice(0, -1).join('.');

      loadingMessage.style.display = 'block';
      toggleViewButton.style.display = 'block';
      layerToggle.style.display = 'block';

      await invokeConvertFile(filePath);
    }
  });

  // show marauder info picture and hide file selection page
  moreInfo.addEventListener('click', () => {
    welcomeMessage.style.display = 'none';
    selectFileButton.style.display = 'none';
    infoMessage.style.display = 'block';
    backButton.style.display = 'block';
    logoicon.style.display = 'block';
  });

  // upon clicking the back arrow return to file selection
  backButton.addEventListener('click', () => {
    infoMessage.style.display = 'none';
    logoicon.style.display = 'none';
    backButton.style.display = 'none';
    welcomeMessage.style.display = 'block';
    selectFileButton.style.display = 'block';
  });
});


// receive notification after successful conversion
window.electronAPI.receive('file:converted', (generatedFilePath) => {
  const script = document.createElement('script');
  script.src = generatedFilePath;

  script.onload = () => {
    loadingMessage.style.display = 'none';
    monitorQuixeInput();
    monitorQuixeOutput(true);
  };

   // some rooms can be printed after single keystrokes
  document.addEventListener('keydown', () => {
    console.log('Key pressed:', event.key); // show what key was pressed

  checkForNewRoom(); 
  SUBHEADERTXT = []; 
  NORMALTXT = [];
 });
  



  script.onerror = () => {
    loadingMessage.style.display = 'none';
    console.error('Failed to load script:', generatedFilePath);
  };

  document.body.appendChild(script);
});

function getTargetContainer() {
    let container = document.querySelector('.WindowRock_202') || document.querySelector('.WindowRock_201');
    if (!container) {
      console.warn('No valid container found');
    }
    return container;
  }

// --------------------------------------------------------- GAME OUTPUT MONITORING ---------------------------------------------------------


function monitorQuixeOutput(captureInitial = false) {
  const targetNode = document.getElementById('windowport');
  const config = { childList: true, subtree: true };

  const callback = (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('Style_subheader')) {
              const bufferLine = node.closest('div.BufferLine');
              const subheaderText = node.textContent.trim();


  //here we have to check if style_Subheader coexists with style_Normal then do not capture it UNLESS the style_Normal contains parentheses. Example studio
              if (subheaderText !== '') {
                const normalElement = bufferLine?.querySelector('.Style_normal');
  
                // check if .Style_normal exists and if it contains parentheses
                if (!normalElement || (normalElement && /[()]/.test(normalElement.textContent))) {
                  // capture the subheader if no .Style_normal or if .Style_normal contains parentheses
                  SUBHEADERTXT.push(subheaderText);
  
                  if (SUBHEADERTXT.length === 1) {
                   const container = getTargetContainer();
                    if (container) {
                      const initialNormalElements = container.querySelectorAll('.Style_normal, .Style_preformatted');
                      initialNormalElements.forEach(normalElement => {
                        const normalText = normalElement.textContent.trim();
                        if (normalText !== '') {
                          const splitText = splitNormalText(normalText);
                          NORMALTXT.push(...splitText);
                        }
                      });
                    }
                  }
                  checkForNewRoom();
                } else {
                  //console.log('Subheader ignored because Style_normal does not contain parentheses:', subheaderText);
                }
              }
            }
          }
        });
      }
    }
  };
  

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);

  if (captureInitial) {
    const initialSubheaderElements = targetNode.querySelectorAll('.Style_subheader');
    initialSubheaderElements.forEach(subheaderElement => {
      const subheaderText = subheaderElement.textContent.trim();
      if (subheaderText !== '') {
        SUBHEADERTXT.push(subheaderText);
      }
    });

    const initialNormalElements = targetNode.querySelectorAll('.WindowRock_202 .Style_normal, .Style_preformatted');
    initialNormalElements.forEach(normalElement => {
      const normalText = normalElement.textContent.trim();
      if (normalText !== '') {
        const splitText = splitNormalText(normalText);
        NORMALTXT.push(...splitText);
      }
    });
    checkForNewRoom();
  }
}



function splitNormalText(text) {
  // Firstly split by double hyphen, avoid messages like "------------this is for that------------"" being printed as rooms
  let parts = text.split(/-{2,}/).map(s => s.trim()).filter(Boolean);
  
  // Then split by other symbols
  return parts.flatMap(part => part.split(/(?:\s{2,}|[!@#:$%^|&*\[\]{};><\/]+)/).map(s => s.trim()).filter(Boolean));
}


function splitNormalTextAgain(text) { 
  return text.split(/(?:\s{2,}|[!()@#:$%^|&*\[\]{};><\/]+)/).map(s => s.trim()).filter(Boolean);
}


function checkForNewRoom() {
  console.log("Checking for new room...");

  SUBHEADERTXT.forEach(subheaderText => {
    const subheaderTrimmed = subheaderText.trim();
     //console.log("Subheader:", subheaderTrimmed);
     //console.log("NORMALTXT:", NORMALTXT);

    // Skip subheaders that are made up entirely of symbols
    if (/^[^a-zA-Z0-9]+$/.test(subheaderTrimmed)) {
      //console.log(`Subheader is made up of only symbols, not considered a room: ${subheaderTrimmed}`);
      SUBHEADERTXT = [];
      NORMALTXT = [];
      return; // by exiting early, don't capture pure symbols as a room
    }



    // Case 1: If Style_normal or Style_preformatted match Style_subheader. Ideal scenario.
    if (NORMALTXT.includes(subheaderTrimmed)) {
      addRoomToArray(subheaderTrimmed);
      window.electronAPI.sendDetectedRoom(subheaderTrimmed);

      SUBHEADERTXT = [];
      NORMALTXT = [];
      //Exit early since we got a match otherwise it will move down the code and call textblob
      return;
    }

    if (exactMatchWords.includes(subheaderTrimmed)) {
      //console.log(`Subheader already in exactMatchWords: ${subheaderTrimmed}`);
      SUBHEADERTXT = [];
      NORMALTXT = [];
      return; // avoid capturing exactmatchwords as rooms
    }

    // Case 2: Style_normal and Style_preformatted are empty
    else if (NORMALTXT.length === 0) {
     // console.log("No normal or preformatted text, checking room validity...");

      const forbiddenWords = ['help', 'menu','chapter','episode','about','inventory','information','march','credits','commands','hints','info','check', 'hint', 'tip','damage','tutorial','score','welcome','status','options','thoughts','look','climb','recap','revenue','start','restore','save','load'];
      const directions = ['north', 'east', 'south', 'west', 'northeast', 'northwest', 'southeast', 'southwest','up','down','in','out','inside','outside'];
      const subheaderWords = subheaderTrimmed.split(/\s+/);

      // If the subheader contains exactly one word and it's north/east/south/west etc, don't capture
      if (subheaderWords.length === 1 && directions.includes(subheaderWords[0].toLowerCase())) {
        //console.log(`Subheader is a single direction word (${subheaderWords[0]}), not considered a room.`);
        SUBHEADERTXT = [];
        NORMALTXT = [];
        return; // Exit early, don't capture it as a room
      }

      // If the subheader contains any forbidden word, don't capture
      const containsForbidden = forbiddenWords.some(word => subheaderTrimmed.toLowerCase().includes(word));
      const isExactMatch = exactMatchWords.includes(subheaderTrimmed.toLowerCase());
      if (containsForbidden || isExactMatch) {
        //console.log(`Subheader contains a forbidden word, not considered a room: ${subheaderTrimmed}`);
        SUBHEADERTXT = [];
        NORMALTXT = [];
        return; // Exit early, don't capture it as a room
      }
// start timer rihgt before calling Python
const startTime = performance.now();  // Record the start time
      // Call textblob to check for verbs (don't capture if a verb is present)
      window.electronAPI.invoke('runPythonRoomDetection', subheaderTrimmed, '').then((containsVerb) => {
        const endTime = performance.now();  // Record the end time
        const durationMs = endTime - startTime;  // this is how long python took to detect possible verbs
        const durationSeconds = durationMs / 1000.0;
        const formattedDuration = durationSeconds.toFixed(2);


        // log the time taken
        console.log(`Textblob room detection took ${formattedDuration} seconds.`);  
        if (!containsVerb) {
          addRoomToArray(subheaderTrimmed);  // Capture the room
          window.electronAPI.sendDetectedRoom(subheaderTrimmed);
        } else {
          //console.log(`Subheader contains a verb, not considered a room: ${subheaderTrimmed}`);
        }
        SUBHEADERTXT = [];
        NORMALTXT = [];
      }).catch(error => {
        console.error('Error detecting room:', error);
      });
    }
    // Case 3: Style_normal or Style_preformatted are not empty, but don't match Style_subheader
    else if (NORMALTXT.length > 0 && !NORMALTXT.includes(subheaderTrimmed)) {
      //console.log("No exact match, checking further...");


      /*Here we will split the normal/preformatted text again by parentheses and check if the new texts match Style_subheader to return early */

      // Split the captured normal/preformatted text again
      let splitagainNormalTXT = [];
      NORMALTXT.forEach(text => {
          splitagainNormalTXT.push(...splitNormalTextAgain(text));
      });
  
      // Re-check if Style_normal or Style_preformatted match Style_subheader after splitting
      if (splitagainNormalTXT.includes(subheaderTrimmed)) {
          addRoomToArray(subheaderTrimmed);
          window.electronAPI.sendDetectedRoom(subheaderTrimmed);
          SUBHEADERTXT = [];
          NORMALTXT = [];
          return; // Return early if we find a match after splitting
      }


      const forbiddenWords = ['help','credits', 'menu','chapter','episode','about','inventory','information','commands','march','damage', 'hint','hints','check','info', 'tip','tutorial','score','welcome','status','options','thoughts','look','climb','recap','revenue','start','restore','save','load'];
      const directions = ['north', 'east', 'south', 'west', 'northeast', 'northwest', 'southeast', 'southwest','up','down','in','out','inside','outside'];
      const subheaderWords = subheaderTrimmed.split(/\s+/);

      // If the subheader contains exactly one word and it's north/east/south/west etc, don't capture
      if (subheaderWords.length === 1 && directions.includes(subheaderWords[0].toLowerCase())) {
        //console.log(`Subheader is a single direction word (${subheaderWords[0]}), not considered a room.`);
        SUBHEADERTXT = [];
        NORMALTXT = [];
        return; // Exit early, don't capture it as a room
      }

      // If the subheader contains any forbidden word don't capture
      const containsForbidden = forbiddenWords.some(word => subheaderTrimmed.toLowerCase().includes(word));
      const isExactMatch = exactMatchWords.includes(subheaderTrimmed.toLowerCase());
      if (containsForbidden || isExactMatch) {
       // console.log(`Subheader contains a forbidden word, not considered a room: ${subheaderTrimmed}`);
        SUBHEADERTXT = [];
        NORMALTXT = [];
        return; // Exit early, don't capture it as a room
      }
// start timer rihgt before calling Python
const startTime = performance.now();  // Record the start time
      // Call Python to check for verbs (don't capture if a verb is present)
      window.electronAPI.invoke('runPythonRoomDetection', subheaderTrimmed, '').then((containsVerb) => {
        const endTime = performance.now();  // Record the end time
        const durationMs = endTime - startTime;  // this is how long python took to detect possible verbs
        const durationSeconds = durationMs / 1000.0;
        const formattedDuration = durationSeconds.toFixed(2);      
       console.log(`Textblob room detection took ${formattedDuration} seconds.`);  
        if (!containsVerb) {
          addRoomToArray(subheaderTrimmed);  // Capture the room
          window.electronAPI.sendDetectedRoom(subheaderTrimmed);
        } else {
         // console.log(`Subheader contains a verb, not considered a room: ${subheaderTrimmed}`);
        }
        SUBHEADERTXT = [];
        NORMALTXT = [];
      }).catch(error => {
        console.error('Error detecting room:', error);
      });
    }
  });
}




function monitorQuixeInput() {
  const targetNode = document.getElementById('windowport');
  const config = { childList: true, subtree: true };

  // Fix for capturing the very first input right away and not assume 'annoying...' south
  const existingInput = targetNode.querySelector('input[type="text"]');
  if (existingInput) {
    existingInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        lastUserCommand = existingInput.value.trim();
       console.log('Captured input in renderer.js:', lastUserCommand);
        sendUserInput(lastUserCommand);
      }
    });


  }

  const callback = (mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'INPUT' && node.type === 'text') {
            node.addEventListener('keydown', (event) => {
              if (event.key === 'Enter') {
                lastUserCommand = node.value.trim();
                console.log('Captured input in renderer.js:', lastUserCommand);
                sendUserInput(lastUserCommand);
              }
            });

     
          }
        });
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}


// add a new room to the list if it's NOT already there
function addRoomToArray(room) {
  if (!detectedRooms.includes(room)) {
    detectedRooms.push(room);
   console.log('Room added to array:', room);
    console.log('Current rooms:', detectedRooms);
  }
    else {
     console.log('Room already in array:', room);
   }
}


