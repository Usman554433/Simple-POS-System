import api from './api';

export const getSalespersons = () => api.get('/salespersons');
export const createSalesperson = (data) => api.post('/salespersons', data);
