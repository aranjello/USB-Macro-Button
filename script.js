'use strict';

let port = null;
let reader;
let writer;
var progMode = false;
let keys = [];
let inputDone;
let wantProg = false;
let waitForVer = false;
let verID;
let multipleOK = false;
let savedButton = 0;

const log = document.getElementById('log');
const button = document.getElementById('button');
const butConnect = document.getElementById('butConnect');
const progButton = document.getElementById('progButton');
const resetButton = document.getElementById('resetButton');
const guiButton = document.getElementById('guiButton');
const releaseButton = document.getElementById('releaseButton');
const releaseAllButton = document.getElementById('releaseAllButton');
const delayButton = document.getElementById('addDelay');

document.addEventListener('DOMContentLoaded', () => {
  butConnect.addEventListener('click', clickConnect);
  progButton.addEventListener('click', saveAndEnd);
  resetButton.addEventListener('click', resetKeys);
  guiButton.addEventListener('click',addLogoKey);
  releaseButton.addEventListener('click',changeRelease);
  releaseAllButton.addEventListener('click',releaseAll);
  delayButton.addEventListener('click',addDelaySend);
  // CODELAB: Add feature detection here.
  const notSupported = document.getElementById('notSupported');
  notSupported.classList.toggle('hidden', 'serial' in navigator);
});

var stupidKeys = {
  //,
  188 : 44,
  //.
  190 : 46,
  ///
  191 : 47,
  //;
  186 : 59,
  //'
  222 : 39,
  //[
  219 : 91,
  //]
  221 : 93,
  //-
  189 : 45,
  //=
  187 : 61,
  //`
  192 : 96,
  //\
  220 : 92,
  //delete
  46 : 127,
  //right arrow
  39 : 126
};

var specialDict = {
  //backspace
  8 : 178,
  //tab
  9 : 179,
  //enter
  13 : 176,
  //Shift
  16 : 129,
  //ctrl
  17 : 128,
  //alt
  18 : 130,
  //escape
  27 : 177,
  //left arrow,
  37 : 216,
  //up arrow
  38 : 218,
  //right arrow
  126 : 215,
  //down arrow
  40 : 217,
  //delete
  127 : 212,
  //f1-f12 = 112-123 : 194 - 205
  112 : 194
};

var specialDictText = {
  //delay
  "-102" : "delay",
  //releaseAll
  "-101" : "release all",
  //release mode
  "-100" : "change mode",
  //backspace
  8 : "backspace",
  //tab
  9 : "Tab",
  //enter
  13 : "Enter",
  //Shift
  16 : "Shift",
  //ctrl
  17 : "Control",
  //alt
  18 : "Alt",
  //escape
  27 : "Escape",
  //space
  32 : "space",
  //left arrow,
  37 : "Left Arrow",
  //up arrow
  38 : "Up Arrow",
  //right arrow
  126 : "Right Arrow",
  //down arrow
  40 : "Down Arrow",
  //delete
  127 : "Delete",
  //f1-f12 = 112-123 : 194 - 205
  112 : "F1",
  //GUI
  131 : "GUI"
};

function displayOptions(val){
  progButton.classList.toggle('hidden',!val);
  resetButton.classList.toggle('hidden',!val);
  guiButton.classList.toggle('hidden',!val);
  releaseButton.classList.toggle('hidden',!val);
  releaseAllButton.classList.toggle('hidden',!val);
  delayButton.classList.toggle('hidden',!val);
  butConnect.classList.toggle('hidden',val);
}

/**
 * @name connect
 * Opens a Web Serial connection to a micro:bit and sets up the input and
 * output stream.
 */
async function connect() {
  // CODELAB: Add code to request & open port here.
  // - Request a port and open a connection.
  port = await navigator.serial.requestPort();
  // - Wait for the port to open.
  await port.open({ baudRate: 9600 });
  const textDecoder = new TextDecoderStream();
  inputDone = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();
  //reader = port.readable.getReader();
  writer = port.writable.getWriter();
  readData();
  wantProg = false;
  button.textContent = "pleases press a button to program";
  writeData(-14);
  waitForVer = true;
  multipleOK = false;
}

async function readData(){
  // Listen to data coming from the serial device.
  while (true) {
    const { value, done } = await reader.read().catch(function(error){
      badDisconnect();
      return;
    });
    if (done) {
      // Allow the serial port to be closed later.
      reader.releaseLock();
      break;
    }
    // value is a Uint8Array.
    console.log(value);
    if(parseInt(value) > 0){
      if(wantProg){
        button.textContent = (parseInt(value)).toString();
        savedButton = parseInt(value);
        resetKeys();
        setProgMode(true);
      }else if(waitForVer){
        verID = parseInt(value);
        waitForVer = false;
        writeData(-10);
        wantProg = true;
      }
    }
  }
}

async function writeData(newData){
  const data = convertToArray(newData);
  console.log(data);
  await writer.write(data);
}

function addDelaySend(){
  writeData(-102);
  keys.push(-102);
  showCurrKeys();
}

function changeRelease(){
  multipleOK = !multipleOK;
  writeData(-100);
  keys.push(-100);
  showCurrKeys();
}

function releaseAll(){
  writeData(-101);
  keys.push(-101);
  showCurrKeys();
}

function convertToArray(data){
  if(typeof(data) == 'number'){
    console.log(data);
    var dataS;
    if(data in specialDict){
      dataS = specialDict[data].toString();
    }else{
      if(data >= 65 && data <= 90){
        data += 32;
      }
      dataS = data.toString();
    }
    var dataA = new Uint8Array(dataS.length);
    for(var i = 0; i < dataS.length; i++){
      dataA[i] = dataS.charAt(i).charCodeAt(0);
    }
  }else{
    console.log(typeof(data.charCodeAt()));
    return convertToArray(data.charCodeAt());
  }
  return dataA;
}

function badDisconnect(){
  toggleUIConnected(false);
  port = null;
  displayOptions(false);
  keys = [];
  showCurrKeys();
  button.textContent = "The device was unplugged before the keys could be saved. Please reconnect and try again";
}

/**
 * @name disconnect
 * Closes the Web Serial connection.
 */
async function disconnect() {
  // CODELAB: Close the input stream (reader).
  writeData(-12);
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
  }
  // CODELAB: Close the output stream.
  if (writer) {
    await writer.close();
    writer = null;
  }
  // CODELAB: Close the port.
  await port.close();
  port = null;
  toggleUIConnected(false);
  displayOptions(false);
  keys = [];
  showCurrKeys();
  button.textContent = "";
}

async function setProgMode(val){
  if(val){
    //writeData(-10);
    document.addEventListener('keydown',myKeyPress)
    displayOptions(true);
  }else{
    writeData(-13);
    document.removeEventListener('keydown',myKeyPress)
    button.textContent = "please press a button to start programming"
  }
}

function addLogoKey(){
  var keynum = 131;
  if(!keys.includes(keynum)){
    keys.push(keynum)
    writeData(keynum)
    showCurrKeys();
  }
}

function saveAndEnd(){
  setProgMode(false);
  wantProg = true;
  displayOptions(false);
}

function resetKeys(){
  writeData(-11);
  keys = [];
  showCurrKeys();
  multipleOK = false;
  button.textContent = savedButton;
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
  // CODELAB: Add disconnect code here.
  if (port) {
    await disconnect();
    toggleUIConnected(false);
    return;
  }
  // CODELAB: Add connect code here.
  await connect();
  toggleUIConnected(true);
  keys = [];
  showCurrKeys();
}

function toggleUIConnected(connected) {
  let lbl = 'Connect';
  if (connected) {
    lbl = 'Disconnect and save program';
  }
  butConnect.textContent = lbl;
}


function showCurrKeys(){
  log.textContent = "";
  keys.forEach(element => {
    if(element in specialDictText){
      log.textContent += specialDictText[element] + "+"
    }else if(element.toString() in specialDictText){
      log.textContent += specialDictText[element.toString()] + "+"
    }else{
      log.textContent += String.fromCharCode(element) + "+"
    }
  });
  log.textContent = log.textContent.substring(0,log.textContent.length-1);
}

function myKeyPress(e){
  var keynum;
  e.preventDefault();
  //e.stopPropagation();
  if(window.event) { // IE                  
    keynum = e.keyCode;
  } else if(e.which){ // Netscape/Firefox/Opera                 
    keynum = e.which;
  }
  if(keynum in stupidKeys){
    keynum = stupidKeys[keynum];
  }
  if(keys.length < 25 && (multipleOK || !keys.includes(keynum))){
    keys.push(keynum)
    writeData(keynum)
    showCurrKeys();
  }else if(keys.length >= 25){
    button.textContent = "can only program 25 actions at a time";
  }
}