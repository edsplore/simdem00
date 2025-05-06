import { useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { API_ERROR_EVENT } from '../../services/api/interceptors';

const ErrorListener = () => {
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; status?: number }>;
      const { message, status } = customEvent.detail;

      // Format the error message with status code if available
      const formattedMessage = status 
        ? `Error ${status}: ${message}` 
        : message;

      showNotification(formattedMessage, 'error');
    };

    // Add event listener
    window.addEventListener(API_ERROR_EVENT, handleApiError);

    // Clean up
    return () => {
      window.removeEventListener(API_ERROR_EVENT, handleApiError);
    };
  }, [showNotification]);

  // This component doesn't render anything
  return null;
};

export default ErrorListener;