import {StyleSheet} from 'react-native';
import {
  BACKGROUND_COLOR_PRIMARY,
  PRIMARY_COLOR,
  TEXT_COLOR_PRIMARY,
  TEXT_COLOR_TERTIARY,
} from '../../../../contants/colors';

const saleItemStyles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: BACKGROUND_COLOR_PRIMARY,
    borderRadius: 15,
    paddingVertical: 22,
    paddingHorizontal: 12,
    gap: 14,
    marginHorizontal: 10,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.74,
    shadowRadius: 25,
    elevation: 16,
  },
  isNew: {
    backgroundColor: '#e1effe',
  },
  details: {
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
  },
  detailsIcons: {
    flexDirection: 'column',
    gap: 16,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 10,
    height: 50,
    width: 50,
  },
  badgeNewContainer: {
    display: 'flex',
    backgroundColor: 'lightgreen',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    //Box Shadow green big
    shadowColor: 'green',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.99,
    shadowRadius: 25,
    elevation: 16,
  },
  badgeNew: {
    color: '#03543f',
    fontSize: 16,
    fontWeight: 'bold',
  },
  number: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    fontSize: 20,
  },
  labels: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    lineHeight: 24,
    width: 'auto',
  },
  address: {
    fontSize: 16,
    color: TEXT_COLOR_TERTIARY,
    width: 'auto',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 8,
  },
  progressDetails: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 17,
  },
  prograssCant: {
    color: TEXT_COLOR_TERTIARY,
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 20,
  },
});

export default saleItemStyles;
