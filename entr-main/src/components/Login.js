import React, { useState } from 'react';
import { loginUser } from '../services/authService';
import { saveUser, getUser } from '../utils/indexedDB';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        if (navigator.onLine) {
            // ✅ Online mode: Authenticate via API
            const result = await loginUser(username, password);

            if (result.success) {
                localStorage.setItem('token', result.token);
                await saveUser({ username, token: result.token }); // Save user in IndexedDB
                navigate('/dashboard');
            } else {
                setMessage(result.message);
            }
        } else {
            // ✅ Offline mode: Authenticate using IndexedDB
            const storedUser = await getUser(username);

            if (storedUser && storedUser.token) {
                console.log("Offline login successful using stored credentials.");
                navigate('/dashboard');
            } else {
                setMessage('Login failed. No offline credentials found.');
            }
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div className="login-input-container">
                    <h4>Username</h4>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <h4>Password</h4>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Login;
