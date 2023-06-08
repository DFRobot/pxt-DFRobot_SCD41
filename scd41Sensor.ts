
//% weight=100 color=#9999FF icon="\uf2f1" block="SCD41 Infrared CO2 Sensor (SEN0536)"
namespace scd41Sensor {

    export enum BeginPara {
        //% blockId="scd41Sensor_Elevation" block="Elevation"
        Elevation,
        //% blockId="scd41Sensor_Pressure" block="Air Pressure"
        Pressure,
    }

    export enum MeasureStatus {
        //% blockId="scd41Sensor_Start" block="Start"
        Start,
        //% blockId="scd41Sensor_Stop" block="Stop"
        Stop,
    }

    export enum MeasureData {
        //% blockId="scd41Sensor_Temperature" block="Temperature"
        Temperature,
        //% blockId="scd41Sensor_Humidity" block="Humidity"
        Humidity,
        //% blockId="scd41Sensor_CO2" block="CO2"
        CO2,
    }


    const SCD4X_I2C_ADDR              = 0x62;

    const SCD4X_SERIAL_NUMBER_WORD0   = 0xbe02   ///< SCD4X serial number 0
    const SCD4X_SERIAL_NUMBER_WORD1   = 0x7f07   ///< SCD4X serial number 1
    const SCD4X_SERIAL_NUMBER_WORD2   = 0x3bfb   ///< SCD4X serial number 2

    const SCD4X_CRC8_INIT             = 0xFF
    const SCD4X_CRC8_POLYNOMIAL       = 0x31

    /* SCD4X Basic Commands */
    const SCD4X_START_PERIODIC_MEASURE    = 0x21b1   ///< start periodic measurement, signal update interval is 5 seconds.
    const SCD4X_READ_MEASUREMENT          = 0xec05   ///< read measurement
    const SCD4X_STOP_PERIODIC_MEASURE     = 0x3f86   ///< stop periodic measurement command

    /* SCD4X On-chip output signal compensation */
    const SCD4X_SET_TEMPERATURE_OFFSET    = 0x241d   ///< set temperature offset
    const SCD4X_GET_TEMPERATURE_OFFSET    = 0x2318   ///< get temperature offset
    const SCD4X_SET_SENSOR_ALTITUDE       = 0x2427   ///< set sensor altitude
    const SCD4X_GET_SENSOR_ALTITUDE       = 0x2322   ///< get sensor altitude
    const SCD4X_SET_AMBIENT_PRESSURE      = 0xe000   ///< set ambient pressure

    /* SCD4X Field calibration */
    const SCD4X_PERFORM_FORCED_RECALIB    = 0x362f   ///< perform forced recalibration
    const SCD4X_SET_AUTOMATIC_CALIB       = 0x2416   ///< set automatic self calibration enabled
    const SCD4X_GET_AUTOMATIC_CALIB       = 0x2313   ///< get automatic self calibration enabled

    /* SCD4X Low power */
    const SCD4X_START_LOW_POWER_MEASURE   = 0x21ac   ///< start low power periodic measurement, signal update interval is approximately 30 seconds.
    const SCD4X_GET_DATA_READY_STATUS     = 0xe4b8   ///< get data ready status

    /* SCD4X Advanced features */
    const SCD4X_PERSIST_SETTINGS          = 0x3615   ///< persist settings
    const SCD4X_GET_SERIAL_NUMBER         = 0x3682   ///< get serial number
    const SCD4X_PERFORM_SELF_TEST         = 0x3639   ///< perform self test
    const SCD4X_PERFORM_FACTORY_RESET     = 0x3632   ///< perform factory reset
    const SCD4X_REINIT                    = 0x3646   ///< reinit

    /* SCD4X Low power single shot */
    const SCD4X_MEASURE_SINGLE_SHOT            = 0x219d   ///< measure single shot
    const SCD4X_MEASURE_SINGLE_SHOT_RHT_ONLY   = 0x2196   ///< measure single shot rht only
    const SCD4X_POWER_DOWN                     = 0x36e0   ///< Put the sensor from idle to sleep to reduce current consumption.
    const SCD4X_WAKE_UP                        = 0x36f6   ///< Wake up the sensor from sleep mode into idle mode.

    
    
    /**
     * @param value , eg: "540"
     */

    //% blockId=scd41Sensor_begin block="SCD41 Init %value %para"
    //% weight=100
    export function begin(value: number, para: BeginPara): void {
        enablePeriodMeasure(SCD4X_STOP_PERIODIC_MEASURE);
        getSerialNumber();
        serial.writeLine("begin ok!");
        if (para == BeginPara.Elevation)
            writeData(SCD4X_SET_SENSOR_ALTITUDE, pack(value), true);
        else if (para == BeginPara.Pressure) {
            writeData(SCD4X_SET_AMBIENT_PRESSURE, pack(Math.ceil(value / 100)), true);
        }
    }

    /**
     * 
     */

    //% blockId=scd41Sensor_measure block="SCD41 %status measure"
    //% weight=80
    export function measure(status: MeasureStatus): void {
        if (status == MeasureStatus.Start)
            enablePeriodMeasure(SCD4X_START_PERIODIC_MEASURE);
        else if (status == MeasureStatus.Stop) {
            enablePeriodMeasure(SCD4X_STOP_PERIODIC_MEASURE);
        }
    }

    /**
     * 
     */

    //% blockId=scd41Sensor_getStatus block="Is the sensor data updated?"
    //% weight=60
    export function getStatus(): boolean {

        let buf = readData(SCD4X_GET_DATA_READY_STATUS, 3);
        if (0x0000 == (byteToWord(buf[0], buf[1]) & 0x7FF)) {
            return false;
        }
        return true;
    }

    /**
     * 
     */

    //% blockId=scd41Sensor_getdata block="get %data"
    //% weight=40
    export function getdata(data: MeasureData): number {
        let value = 0;
        let buf = readData(SCD4X_READ_MEASUREMENT, 9);
        if (data == MeasureData.Temperature) {
            value = -45 + 175 * Math.round((byteToWord(buf[3], buf[4])) / (1 << 16));
        } else if (data == MeasureData.Humidity) {
            value = 100 * Math.round((byteToWord(buf[6], buf[7])) / (1 << 16));
        } else {
            value = byteToWord(buf[0], buf[1])
        }
        return value;
    }

    function enablePeriodMeasure(mode: number) {
        writeData(mode, null, true);
        if (SCD4X_STOP_PERIODIC_MEASURE == mode)
            basic.pause(500);                   // Give it some time to switch mode
    }

    function getSerialNumber(): number[] {
        let wordBuf: number[] = [];
        let buf = readData(SCD4X_GET_SERIAL_NUMBER, 9);
        wordBuf.push(byteToWord(buf[0], buf[1]));
        wordBuf.push(byteToWord(buf[3], buf[4]));
        wordBuf.push(byteToWord(buf[6], buf[7]));
        return wordBuf;
    }

    function pack(data: number): number[]{
        let sendPack: number[] = [];
        sendPack.push((data >> 8) & 0xFF);
        sendPack.push(data & 0xFF);
        sendPack.push(calcCRC(data));
        return sendPack;
    }

    function calcCRC(data: number): number {
        let currentByte;
        let crcbit;
        let crc = SCD4X_CRC8_INIT;
        let buf = [(data >> 8) & 0xFF, data & 0xFF];
        for (currentByte = 0; currentByte < 2; currentByte++) {
            crc = crc ^ buf[currentByte];
            for (crcbit = 8; crcbit > 0; crcbit--) {
                if (crc & 0x80)
                    crc = (crc << 1) ^ SCD4X_CRC8_POLYNOMIAL;
                else
                    crc = (crc << 1);
            }
        }
        return crc;
    }

    function byteToWord(msb: number, lsb: number): number {
        return (msb << 8) | lsb;
    }

    function readData(reg: number, len: number): Buffer{
        // pins.i2cWriteNumber(SCD4X_I2C_ADDR, reg, NumberFormat.UInt8BE, true);
        pins.i2cWriteBuffer(SCD4X_I2C_ADDR, pins.createBufferFromArray([(reg >> 8) & 0xFF, reg & 0xFF]), true);
        return pins.i2cReadBuffer(SCD4X_I2C_ADDR, len, false);
    }

    
    function writeData(cmd: number, buf: number[] = null, flag: boolean = false): void { 
        //flag: false (cmd is byte eg: 0xff)  
        //flag: ture (cmd is bytes eg: 0xffff)
        let cmdArray: number[] = [];
        if (flag){
            cmdArray.push((cmd >> 8) & 0xFF);
            cmdArray.push(cmd & 0xFF);
        } else {
            cmdArray.push(cmd);
        }
        if (buf == null || buf.length == 0) {
            pins.i2cWriteBuffer(SCD4X_I2C_ADDR, pins.createBufferFromArray(cmdArray));
        } else {
            pins.i2cWriteBuffer(SCD4X_I2C_ADDR, pins.createBufferFromArray(cmdArray), true);
            pins.i2cWriteBuffer(SCD4X_I2C_ADDR, pins.createBufferFromArray(buf));
        }  
    }

}