export const loginUser = async (username, password) => {
    const API_URL = 'http://15.207.206.215/api/api/User/login'; // Ensure this URL is correct

    try {
        console.log('Attempting login...', username, password);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            return { success: false, message: errorData.message || 'Login failed' };
        }

        const data = await response.json();
        console.log('Login successful:', data);

        return { success: true, message: 'Login successful', token: data.token };
    } catch (error) {
        console.error('Network Error:', error);
        return { success: false, message: 'Network error' };
    }
};
