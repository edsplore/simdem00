import axios from 'axios';

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  fullName: string;
}

export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get('https://eu2ccapdagl001.eastus2.cloudapp.azure.com/uam/api/users', {
      params: {
        status: 'ACTIVE'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};