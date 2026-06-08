Arduino Logic:

#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s.h>


#define I2S_PORT I2S_NUM_0


// ================= WIFI =================

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";


// Backend endpoint
const char* serverURL = "http://YOUR_IP:3000/api/mic";


// ================= I2S =================

#define I2S_SD 17
#define I2S_WS 16
#define I2S_SCK 15


// ================= LEDs =================

#define GREEN_LED 18
#define YELLOW_LED 19
#define RED_LED 21



// Tune these

#define GREEN_THRESHOLD 500
#define RED_ON_THRESHOLD 180
#define RED_OFF_THRESHOLD 100



int ledState = 0;

// 0 = idle
// 1 = detecting sound
// 2 = speaking



void setup() {

  Serial.begin(115200);


  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);



  // WIFI

  WiFi.begin(ssid,password);

  Serial.print("Connecting");

  while(WiFi.status()!=WL_CONNECTED){

    delay(500);
    Serial.print(".");
  }


  Serial.println();
  Serial.println("WiFi connected");




  // I2S


  i2s_config_t i2s_config = {

    .mode = (i2s_mode_t)(
      I2S_MODE_MASTER |
      I2S_MODE_RX
    ),

    .sample_rate = 16000,

    .bits_per_sample =
      I2S_BITS_PER_SAMPLE_32BIT,


    .channel_format =
      I2S_CHANNEL_FMT_ONLY_LEFT,


    .communication_format =
      I2S_COMM_FORMAT_I2S,


    .intr_alloc_flags =
      ESP_INTR_FLAG_LEVEL1,


    .dma_buf_count = 8,

    .dma_buf_len = 64,


    .use_apll = false,

    .tx_desc_auto_clear = false,

    .fixed_mclk = 0
  };



  i2s_pin_config_t pin_config = {

    .bck_io_num = I2S_SCK,

    .ws_io_num = I2S_WS,

    .data_out_num =
      I2S_PIN_NO_CHANGE,

    .data_in_num =
      I2S_SD
  };



  i2s_driver_install(
    I2S_PORT,
    &i2s_config,
    0,
    NULL
  );


  i2s_set_pin(
    I2S_PORT,
    &pin_config
  );


  updateLED();

}




void loop(){


  int32_t sample;

  size_t bytesRead;



  i2s_read(
    I2S_PORT,
    &sample,
    sizeof(sample),
    &bytesRead,
    portMAX_DELAY
  );



  int volume =
    abs(sample) / 100000;



  // smoothing

  static int avgVolume = 0;


  avgVolume =
    (avgVolume * 9 + volume) / 10;



  Serial.println(avgVolume);




  // ======================
  // SPEAKING DETECTION
  // ======================


  if(ledState == 0){

    // idle

    if(avgVolume >= GREEN_THRESHOLD)
      ledState = 2;


    else if(avgVolume >= RED_ON_THRESHOLD)
      ledState = 1;

  }




  else if(ledState == 1){

    // sound

    if(avgVolume >= GREEN_THRESHOLD)
      ledState = 2;


    else if(avgVolume <= RED_OFF_THRESHOLD)
      ledState = 0;

  }




  else if(ledState == 2){

    // speaking

    if(avgVolume <= RED_OFF_THRESHOLD)
      ledState = 0;

  }



  updateLED();


  sendStatus(avgVolume);



  delay(500);

}







void sendStatus(int volume){


  if(WiFi.status()!=WL_CONNECTED)
    return;



  HTTPClient http;


  http.begin(serverURL);


  http.addHeader(
    "Content-Type",
    "application/json"
  );



  bool speaking =
    (ledState == 2);



  String json =

  "{"
  "\"device\":\"user-01\","
  "\"speaking\":"
  +
  String(
    speaking ? "true":"false"
  )
  +
  ","
  "\"volume\":"
  +
  String(volume)
  +
  "}";



  int code =
    http.POST(json);



  Serial.print(
    "Server:"
  );

  Serial.println(code);



  http.end();

}






void updateLED(){


  digitalWrite(
    GREEN_LED,
    ledState == 2
  );


  digitalWrite(
    RED_LED,
    ledState == 1
  );


  digitalWrite(
    YELLOW_LED,
    ledState == 0
  );

}

Requirements:
Faster-Whisper

In the meetings and defenses, the Arduino should act as a gate, only transcribing using Faster-Whisper if the voices are above the threshold. Make the necessary backend requirements, like making a separate table to put the transcriptions, assigning them to meetings/defenses via ID so they can be easily accessible by the users involved in that meeting/defense. Make a dedicated tab for that as well in the frontend so that the users involved in the meeting can have a read-only + download as .txt file.