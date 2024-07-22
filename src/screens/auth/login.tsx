import React, {useState} from 'react';
import {View, TextInput, Button, Text, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {auth} from '../../firebase/connection';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  // const handleLogin = async () => {
  //   try {
  //     const user = await getUser(email);
  //     if (password !== user.P) {
  //       Alert.alert('Contraseña incorrecta');
  //       return;
  //     } else {
  //       await AsyncStorage.setItem('user', JSON.stringify(user));
  //       navigation.navigate('Home' as never);
  //     }
  //   } catch (error) {
  //     Alert.alert('Error en el inicio de sesión');
  //   }
  // };

  const handleLogin = async () => {
    try {
      auth()
        .signInWithEmailAndPassword(email, password)
        .then(user => {})
        .catch(error => {
          console.log('error', error);
        });
      // navigation.navigate('Home' as never);
    } catch (error) {
      Alert.alert('Error en el inicio de sesión');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
    color: 'black',
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
  },
  link: {
    color: 'blue',
  },
});

export default LoginScreen;
