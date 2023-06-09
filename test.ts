scd41Sensor.begin(540, scd41Sensor.BeginPara.Elevation)
scd41Sensor.measure(scd41Sensor.MeasureStatus.Start)
basic.forever(function () {
    if (scd41Sensor.getStatus()) {
        serial.writeLine("" + (scd41Sensor.getdata(scd41Sensor.MeasureData.Temperature)))
        serial.writeLine("" + (scd41Sensor.getdata(scd41Sensor.MeasureData.Humidity)))
        serial.writeLine("" + (scd41Sensor.getdata(scd41Sensor.MeasureData.CO2)))
    }
    basic.pause(1000)
})