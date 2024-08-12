import SQLite from 'react-native-sqlite-storage';

// Habilitar Promesas
SQLite.enablePromise(true);

// Abrir la base de datos usando Promises
export const openDatabase = () => {
  return SQLite.openDatabase(
    {
      name: 'msp.db',
      location: 'default',
    },
    () => {
      console.log('Database opened');
    },
    error => {
      console.error('Error opening database:', error);
    },
  );
};
