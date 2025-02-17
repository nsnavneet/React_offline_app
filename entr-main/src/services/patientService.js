import { savePatientData, getPatientData } from '../utils/indexedDB';

const API_URL = 'http://15.207.206.215/api/api/PatientDetails/GetPatientDetail';

export const fetchAndStorePatientData = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('No token found! User may need to log in again.');
        return [];
    }

    if (!navigator.onLine) {
        console.log('Offline mode: Fetching data from IndexedDB');
        return await getPatientData();
    }

    try {
        console.log('Fetching patient data from API with token:', token);

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('API response:', responseData);

        // Extract and store only `data` array
        const patientData = responseData.data || [];

        if (Array.isArray(patientData) && patientData.length > 0) {
            await savePatientData(patientData); // Store only the patient data
            return patientData;
        } else {
            console.warn('No valid patient data received.');
            return [];
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        return [];
    }
};
