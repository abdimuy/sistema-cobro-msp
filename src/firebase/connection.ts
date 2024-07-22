import {firebase, getFirestore} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: 'AIzaSyDRXzWxvwZcs9qVjKvrjoMOOynPwyF0sBo',
  authDomain: 'msp-db-1c2ce.firebaseapp.com',
  projectId: 'msp-db-1c2ce',
  storageBucket: 'msp-db-1c2ce.appspot.com',
  messagingSenderId: '519103475417',
  appId: '1:519103475417:web:405ea92fcd75a753d898c8',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = getFirestore();

db.settings({
  persistence: true,
})
  .then(() => {
    console.log('Firestore persistence enabled');
  })
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.error('Failed precondition: ', err);
    } else if (err.code === 'unimplemented') {
      console.error('Unimplemented: ', err);
    }
  });

export {auth};
