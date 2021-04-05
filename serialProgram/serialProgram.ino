#include <Keyboard.h>
#include <EEPROM.h>

#define numKeys 12
#define versionID 1

int last = 0;

int buttonToProgram = -1;

bool progMode = false;
bool releaseMode = false;

enum keyCodes{
  PROGMODE = -10,
  PROGSTART = -11,
  PROGEND = -12,
  PUTDATA = -13,
  VERQUESTION = -14
};

long debounceDelay = 100;
long timers[numKeys]{0};
long offtimers[numKeys]{0};

bool buttonSet[numKeys]{false};
bool buttonSetOff[numKeys]{true};


struct { 
  int keySet[numKeys][25]{-1};
} data;

bool buttonDebounced(int i){
   //sample the state of the button - is it pressed or not?
  bool buttonState = !digitalRead(i);

  //filter out any noise by setting a time buffer
  if ( (millis() - timers[i-2]) > debounceDelay) {
    //if the button has been pressed, lets toggle the LED from "off to on" or "on to off"
    if (buttonState == HIGH && !buttonSet[i-2]) {
      timers[i-2] = millis(); //set the current time
      buttonSet[i-2] = true;
      return true;
    }
    else if (buttonState == LOW && buttonSet[i-2]) {
      timers[i-2] = millis(); //set the current time
      buttonSet[i-2] = false;
    }
  }
    return false;
}

bool buttonDebouncedOff(int i){
    //sample the state of the button - is it pressed or not?
  bool buttonState = digitalRead(i);

  //filter out any noise by setting a time buffer
  if ( (millis() - offtimers[i-2]) > debounceDelay) {
    //if the button has been pressed, lets toggle the LED from "off to on" or "on to off"
    if (buttonState == HIGH && !buttonSetOff[i-2]) {
      offtimers[i-2] = millis(); //set the current time
      buttonSetOff[i-2] = true;
      return true;
    }
    else if (buttonState == LOW && buttonSetOff[i-2]) {
      offtimers[i-2] = millis(); //set the current time
      buttonSetOff[i-2] = false;
    }
  }
    return false;
}

void resetKeys(int i){
  for(int j = 0; j < 25; j++){
    data.keySet[i][j] = -1;
  }
  last = 0;
}

void setup() {
  for(int i = 0; i < numKeys; i++){
    resetKeys(i);
  }
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.setTimeout(10);
  for(int i = 0; i < numKeys; i++){
      pinMode(i+2,INPUT_PULLUP);
  }
  EEPROM.put(0,data);
}

void loop() {
  // put your main code here, to run repeatedly:
  if(Serial.available()){
    int i = Serial.parseInt();
    if(i == VERQUESTION){
      Serial.print(versionID);
    }
    else if(i == PROGMODE){
      progMode = true;
      char message[25];
      sprintf(message,"progMode is %d",progMode);
      Serial.print(message);
      buttonToProgram = -1;
      releaseMode = false;
    }else if(progMode){
      if(buttonToProgram != -1){
        switch(i){
          case PROGSTART:
            resetKeys(buttonToProgram);
            break;
           case PUTDATA:
            EEPROM.put(0,data);
            buttonToProgram = -1;
            releaseMode = false;
            break;
           default:
            data.keySet[buttonToProgram][last] = i;
            last++;
           break;
        }
      }else{
        if(i == PROGEND){
          progMode = false;
        }
      }
    }
  }else if(progMode){
    for(int j = 2; j < numKeys+2; j++){
        if(buttonDebounced(j) && buttonToProgram+2 != j){
          buttonToProgram = j-2;
          last = 0;
          Serial.print((j-1));
        }
    }
  }
  if(!progMode){
    for(int i = 0; i < numKeys; i++){
      if(buttonDebounced(i+2)){
        for(int j = 0;  data.keySet[i][j] != -1; j++){
          Serial.print(data.keySet[i][j]);
          if(data.keySet[i][j] == -100){
            releaseMode = !releaseMode;
          }else if(data.keySet[i][j] == -101){
            Keyboard.releaseAll();
          }else if(data.keySet[i][j] == -102){
            delay(100);
          }
          else{
            Keyboard.press(data.keySet[i][j]);
            if(releaseMode){
              Keyboard.release(data.keySet[i][j]);
            }
          }
        }
        Keyboard.releaseAll();
        releaseMode = false;
      }
    }
  }
  }
