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

let port;
let reader;
let writer;
var progMode = false;

const log = document.getElementById('log');
const butConnect = document.getElementById('butConnect');
const progButton = document.getElementById('progButton');


document.addEventListener('DOMContentLoaded', () => {
  butConnect.addEventListener('click', clickConnect);
  progButton.addEventListener('click', clickSend);


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
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();
  //reader = port.readable.getReader();
  writer = port.writable.getWriter();
  readData();
}

async function readData(){
  // Listen to data coming from the serial device.
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      // Allow the serial port to be closed later.
      reader.releaseLock();
      break;
    }
    // value is a Uint8Array.
    console.log(value);
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
    if(data == -10){
      progMode = !progMode;
    }
    var dataS;
    if(data in specialDict){
      dataS = specialDict[data].toString();
    }else{
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

/**
 * @name disconnect
 * Closes the Web Serial connection.
 */
async function disconnect() {
  // CODELAB: Close the input stream (reader).
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }
  // CODELAB: Close the output stream.
  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }
  // CODELAB: Close the port.
  await port.close();
  port = null;
  toggleUIConnected(false);
}

async function clickSend(){
  writeData(-10);
  writeData(-11);
  toggleProgram(progMode)
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
  // CODELAB: Add disconnect code here.
  if (port) {
    await disconnect();
    toggleUIConnected(true);
    return;
  }
  // CODELAB: Add connect code here.
  await connect();
  toggleUIConnected(true);
}

function toggleUIConnected(connected) {
  let lbl = 'Connect';
  if (connected) {
    lbl = 'Disconnect';
  }
  butConnect.textContent = lbl;
}

function toggleProgram(connected) {
  let lbl = 'start Program';
  if (connected) {
    lbl = 'stop Program';
  }
  progButton.textContent = lbl;
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
  if(keynum >= 65 && keynum <= 90){
    keynum += 32;
  }
  //if(progMode){
    writeData(keynum)
  //}
}