import axios from 'axios';
import { TrainingData } from '../types/training';

export const fetchTrainingData = async (userId: string): Promise<TrainingData> => {
  try {
    const response = await axios.post('/api/fetch-assigned-plans', {
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching training data:', error);
    throw error;
  }
};