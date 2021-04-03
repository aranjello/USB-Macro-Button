#include <Keyboard.h>
#include <EEPROM.h>

int keySet[6]{-1};
int last = 0;

bool progMode = false;

enum keyCodes{
  PROGMODE = -10,
  PROGSTART = -11,
  PROGEND = -12
};

long debounceDelay = 100;
long timers[7]{0};
long offtimers[7]{0};

bool buttonSet[7]{false};
bool buttonSetOff[7]{true};

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

void resetKeys(){
  for(int i = 0; i < 6; i++){
    keySet[i] = -1;
  }
  last = 0;
}

void setup() {
  resetKeys();
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial.setTimeout(100);
  pinMode(2,INPUT_PULLUP);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB
  }
}

void loop() {
  // put your main code here, to run repeatedly:
  if(Serial.available()){
    int i = Serial.parseInt();
    if(i == PROGMODE){
      progMode = !progMode;
      char message[25];
      sprintf(message,"progMode is %d",progMode);
      Serial.print(message);
    }else if(progMode){
      switch(i){
        case PROGSTART:
          resetKeys();
          break;
         default:
          keySet[last] = i;
          last++;
         break;
      }
    }
  }
  if(!progMode && buttonDebounced(2)){
    for(int i = 0;  keySet[i] != -1; i++){
      Keyboard.press(keySet[i]);
      Serial.print(keySet[i]);
      delay(100);
    }
    Keyboard.releaseAll();
  }
}
