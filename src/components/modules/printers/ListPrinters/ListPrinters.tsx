import {Picker} from '@react-native-picker/picker';
import dayjs from 'dayjs';
import * as React from 'react';
import {StyleSheet, View, Text, Button, TextInput} from 'react-native';
import {
  BLEPrinter,
  NetPrinter,
  USBPrinter,
  IUSBPrinter,
  IBLEPrinter,
  INetPrinter,
} from 'react-native-thermal-receipt-printer';

const printerList: Record<string, any> = {
  ble: BLEPrinter,
  net: NetPrinter,
  usb: USBPrinter,
};

interface SelectedPrinter
  extends Partial<IUSBPrinter & IBLEPrinter & INetPrinter> {
  printerType?: keyof typeof printerList;
}

export default function ListPrinters() {
  const [selectedValue, setSelectedValue] =
    React.useState<keyof typeof printerList>('ble');
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {},
  );

  React.useEffect(() => {
    const getListDevices = async () => {
      const Printer = printerList[selectedValue];
      // get list device for net printers is support scanning in local ip but not recommended
      if (selectedValue === 'net') return;
      try {
        setLoading(true);
        await Printer.init();
        const results = await Printer.getDeviceList();
        setDevices(
          results.map((item: any) => ({...item, printerType: selectedValue})),
        );
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    getListDevices();
  }, [selectedValue]);

  const handleConnectSelectedPrinter = () => {
    if (!selectedPrinter) return;
    const connect = async () => {
      try {
        setLoading(true);
        switch (selectedPrinter.printerType) {
          case 'ble':
            await BLEPrinter.connectPrinter(
              selectedPrinter?.inner_mac_address || '',
            );
            break;
          default:
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    connect();
  };

  const handlePrint = async () => {
    try {
      // [options valueForKey:@"imageWidth"];
      const Printer = printerList[selectedValue];
      const dateCurrent = dayjs().format('DD/MM/YYYY HH:mm:ss');
      await Printer.printText(`
      \x1D\x4C\x00\x00<C>${dateCurrent}</C>\n
      \x1D\x4C\x00\x00<C>--------------------------</C>\n
      `);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleChangeHostAndPort = (params: string) => (text: string) =>
    setSelectedPrinter(prev => ({
      ...prev,
      device_name: 'Net Printer',
      [params]: text,
      printerType: 'net',
    }));

  const _renderNet = () => (
    <View style={{paddingVertical: 16}}>
      <View style={styles.rowDirection}>
        <Text>Host: </Text>
        <TextInput
          placeholder="192.168.100.19"
          onChangeText={handleChangeHostAndPort('host')}
        />
      </View>
      <View style={styles.rowDirection}>
        <Text>Port: </Text>
        <TextInput
          placeholder="9100"
          onChangeText={handleChangeHostAndPort('port')}
        />
      </View>
    </View>
  );

  const _renderOther = () => (
    <Picker selectedValue={selectedPrinter} onValueChange={setSelectedPrinter}>
      {devices.map((item: any, index) => (
        <Picker.Item
          label={item.device_name}
          value={item}
          key={`printer-item-${index}`}
        />
      ))}
    </Picker>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>Select printer: </Text>
        {selectedValue === 'net' ? _renderNet() : _renderOther()}
      </View>
      <Button
        disabled={!selectedPrinter?.device_name}
        title="Connect"
        onPress={handleConnectSelectedPrinter}
      />
      <Button
        disabled={!selectedPrinter?.device_name}
        title="Print sample"
        onPress={handlePrint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  section: {
    flex: 1,
  },
  rowDirection: {
    flexDirection: 'row',
  },
});
