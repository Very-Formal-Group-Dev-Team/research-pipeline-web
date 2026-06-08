#include <driver/i2s.h>

#define I2S_PORT I2S_NUM_0


// ================= DEVICE =================

const char* deviceID = "user-01";


// ================= INMP441 =================

#define I2S_SD 17
#define I2S_WS 16
#define I2S_SCK 15



// ================= LEDs =================

#define GREEN_LED 18
#define YELLOW_LED 19
#define RED_LED 21



// Thresholds

#define GREEN_THRESHOLD 500
#define RED_ON_THRESHOLD 180
#define RED_OFF_THRESHOLD 100



int ledState = 0;

// 0 = yellow
// 1 = red
// 2 = green




void setup() {


  Serial.begin(115200);


  pinMode(GREEN_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);




  // ================= I2S =================


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



  setLEDs();

}





void loop() {


  int32_t sample = 0;

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




  // smooth mic values

  static int avgVolume = 0;


  avgVolume =
    (avgVolume * 9 + volume) / 10;




  Serial.println(avgVolume);





  // =============================
  // SPEAKING DETECTION
  // =============================


  if (ledState == 0) {


    // yellow

    if(avgVolume >= GREEN_THRESHOLD){

      ledState = 2;
    }

    else if(avgVolume >= RED_ON_THRESHOLD){

      ledState = 1;
    }

  }




  else if(ledState == 1){


    // red

    if(avgVolume >= GREEN_THRESHOLD){

      ledState = 2;
    }


    else if(avgVolume <= RED_OFF_THRESHOLD){

      ledState = 0;
    }

  }





  else if(ledState == 2){


    // green

    if(avgVolume < RED_OFF_THRESHOLD){

      ledState = 0;
    }

  }




  setLEDs();



  // SEND TO COMPUTER

  sendStatus(avgVolume);



  delay(100);

}






void sendStatus(int volume){


  bool speaking =
    (ledState == 2);



  Serial.print("{");


  Serial.print("\"device\":\"");
  Serial.print(deviceID);
  Serial.print("\",");



  Serial.print("\"speaking\":");

  Serial.print(
    speaking ? "true" : "false"
  );


  Serial.print(",");



  Serial.print("\"volume\":");

  Serial.print(volume);



  Serial.println("}");

}






void setLEDs(){


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