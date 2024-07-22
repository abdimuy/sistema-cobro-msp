import {StyleSheet} from 'react-native';
import {
  BACKGROUND_COLOR_PRIMARY,
  PRIMARY_COLOR,
} from '../../../contants/colors';

const salesStyles = StyleSheet.create({
  constainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BACKGROUND_COLOR_PRIMARY,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BACKGROUND_COLOR_PRIMARY,
    gap: 12,
    paddingTop: 16,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: PRIMARY_COLOR,
    gap: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerIcon: {
    color: 'white',
  },
  headerSearch: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: 'blue',
    height: 40,
  },
  headerSearchIcon: {
    color: 'grey',
  },
  headerSearchInput: {
    height: 40,
    borderRadius: 20,
    flex: 1,
    backgroundColor: 'white',
    color: 'black',
    fontSize: 20,
    paddingHorizontal: 14,
    paddingVertical: 0,
  },
});

export default salesStyles;
