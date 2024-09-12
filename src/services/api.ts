import axios from 'axios';

const api = axios.create({
  baseURL: 'http://sanpablomuebleria.dyndns.org:3001/',
});

export default api;
