import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { saveUser, getUser, getToken, initDB } from '../utils/indexedDB';
import { fetchAndStorePatientData } from '../services/patientService';
import '../styles/LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // ✅ Auto-login using stored token if available
    useEffect(() => {
        const checkStoredToken = async () => {
            const storedToken = await getToken();
            const storedUser = await getUser(username);

            // Check if the user has logged in before and has a valid token
            if (storedUser && storedUser.firstLogin && storedToken) {
                console.log("Auto-logging in using stored token...");

                navigate('/dashboard');
            }
        };
        checkStoredToken();
    }, [navigate, username]);

    const handleLogin = async (e) => {
        e.preventDefault();

        const storedUser = await getUser(username);

        // Check if it's the first login attempt
        if (!storedUser || !storedUser.firstLogin) {
            if (!navigator.onLine) {
                setMessage('Internet is required for the first login.');
                return;
            }
        }

        if (navigator.onLine) {
            // ✅ Online login: Authenticate via API
            const result = await loginUser(username, password);

            if (result.success) {
                // Store the token in localStorage
                localStorage.setItem('token', result.token);

                // ✅ Store user credentials (including token) in IndexedDB
                await saveUser({ username, password, token: result.token });


                // ✅ Fetch and store patient data
                await fetchAndStorePatientData(result.token);

                // Redirect to the dashboard
                navigate('/dashboard');
            } else {
                setMessage(result.message);
            }
        } else {
            // ✅ Offline login: Authenticate using stored credentials
            if (storedUser && storedUser.token) {
                console.log("Offline login successful using stored credentials.");
                navigate('/dashboard');
            } else {
                setMessage('Login failed. No offline credentials found.');
            }
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {message && <p className="error-message">{message}</p>}
            <form onSubmit={handleLogin}>
                <h4>Username</h4>
                <input
                    type="text"
                    className="login-input"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <h4>Password</h4>
                <input
                    type="password"
                    className="login-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <div className="login-button-container">
                    <button type="submit" className="login-button" onClick={handleLogin}>Login</button>
                </div>
            </form>

        </div>
    );
};

export default LoginPage;