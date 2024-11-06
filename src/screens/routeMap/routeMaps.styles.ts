import {StyleSheet, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

export const routeMapsStyles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
    marginLeft: 20,
  },
  map: {
    width: width,
    height: height / 2 - 80,
  },
  listItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
    marginBottom: 10,
  },
  listItemDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
  subtext: {
    fontSize: 16,
    color: 'black',
  },
  list: {
    height: height / 2 - 50,
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export const stylesMarketCustom = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerText: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'red',
    padding: 4,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: -10, // Para que el texto quede sobre el ícono del marcador
  },
  markerIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'blue',
    borderRadius: 10, // Marcador redondo
  },
});
