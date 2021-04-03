/*
 * @license
 * Getting Started with Web Serial Codelab (https://todo)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

let port = null;
let reader;
let writer;
var progMode = false;
let keys = [];
let inputDone;
let wantProg = false;

const log = document.getElementById('log');
const button = document.getElementById('button');
const butConnect = document.getElementById('butConnect');
const progButton = document.getElementById('progButton');
const resetButton = document.getElementById('resetButton');
const guiButton = document.getElementById('guiButton');


document.addEventListener('DOMContentLoaded', () => {
  butConnect.addEventListener('click', clickConnect);
  progButton.addEventListener('click', saveAndEnd);
  resetButton.addEventListener('click', resetKeys);
  guiButton.addEventListener('click',addLogoKey);
  // CODELAB: Add feature detection here.
  const notSupported = document.getElementById('notSupported');
  notSupported.classList.toggle('hidden', 'serial' in navigator);
});

var specialDict = {
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
  39 : 215,
  //down arrow
  40 : 217,
  //delete
  46 : 212,
  //f1-f12 = 112-123 : 194 - 205
  112 : 194
};

var specialDictText = {
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
  //left arrow,
  37 : "Left Arrow",
  //up arrow
  38 : "Up Arrow",
  //right arrow
  39 : "Right Arrow",
  //down arrow
  40 : "Down Arrow",
  //delete
  46 : "Delete",
  //f1-f12 = 112-123 : 194 - 205
  112 : "F1",
  //GUI
  131 : "GUI"
};

function displayOptions(val){
  progButton.classList.toggle('hidden',!val);
  resetButton.classList.toggle('hidden',!val);
  guiButton.classList.toggle('hidden',!val);
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
  wantProg = true;
  button.textContent = "pleases press a button to program";
  writeData(-10);
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
    if(parseInt(value) < 0 && wantProg){
      button.textContent = (parseInt(value)*-1).toString();
      resetKeys();
      setProgMode(true);
    }
  }
}

async function writeData(newData){
  const data = convertToArray(newData);
  console.log(data);
  await writer.write(data);
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
    writeData(-10);
    document.addEventListener('keydown',myKeyPress)
    displayOptions(true);
  }else{
    writeData(-12);
    document.removeEventListener('keydown',myKeyPress)
    button.textContent = "please press a button to start programming"
    writeData(-10);
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
    lbl = 'Disconnect';
  }
  butConnect.textContent = lbl;
}


function showCurrKeys(){
  log.textContent = "";
  keys.forEach(element => {
    if(element in specialDictText){
      log.textContent += specialDictText[element] + "+"
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
  if(!keys.includes(keynum)){
    keys.push(keynum)
    writeData(keynum)
    showCurrKeys();
  }
}