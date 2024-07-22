import {StyleSheet} from 'react-native';
import {
  BACKGROUND_COLOR_PRIMARY,
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  TERCIARY_COLOR,
  TEXT_COLOR_PRIMARY,
  TEXT_COLOR_SECONDARY,
  TEXT_COLOR_TERTIARY,
} from '../../contants/colors';

const homeStyles = StyleSheet.create({
  container: {
    display: 'flex',
    // flex: 1,
    height: '100%',
  },
  statsTitle: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsSubtitle: {
    color: 'lightsteelblue',
    fontSize: 16,
  },
  stats: {
    backgroundColor: PRIMARY_COLOR,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    height: 200,
  },
  detailsContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 20,
    marginTop: -80,
  },
  details: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: BACKGROUND_COLOR_PRIMARY,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    shadowColor: TEXT_COLOR_TERTIARY,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 10,
  },
  detailsTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    lineHeight: 35,
  },
  detailsColumnLabels: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  detailsTitleSecondary: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_COLOR_PRIMARY,
    lineHeight: 35,
  },
  detailsSubtitle: {
    fontSize: 16,
    color: TEXT_COLOR_TERTIARY,
  },
  detailsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 15,
  },
  detailsRowCardPrimary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: TERCIARY_COLOR,
    flex: 1,
    height: 150,
    borderRadius: 20,
    paddingVertical: 15,
    gap: 8,
  },
  detailsRowCardSecondary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: SECONDARY_COLOR,
    flex: 1,
    height: 150,
    borderRadius: 20,
    paddingVertical: 15,
    gap: 20,
  },
  detailsRowCardTitle: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 35,
    fontWeight: 'bold',
  },
  detailsRowCardSubtitle: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 16,
  },
  detailsRowCardText: {
    color: 'palegreen',
    fontSize: 24,
  },
  detailsProgress: {
    color: TEXT_COLOR_SECONDARY,
    fontSize: 26,
    fontWeight: 'bold',
  },
  detailsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  },
  detailsColumnItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 20,
  },
  closeSesion: {
    backgroundColor: PRIMARY_COLOR,
    padding: 10,
    borderRadius: 10,
    width: '90%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  closeSesionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentPrimaryText: {
    color: PRIMARY_COLOR,
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentSecondaryText: {
    color: SECONDARY_COLOR,
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentTertiaryText: {
    color: TERCIARY_COLOR,
    fontSize: 20,
  },
});

export default homeStyles;
