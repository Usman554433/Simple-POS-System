import api from './api';

export const getProducts = (query) => 
  api.get(`/products${query ? `?search=${query}` : ''}`);

export const createProduct = (data) =>
  api.post('/products', data);
