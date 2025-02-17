import React, { useEffect, useState } from 'react';
import { getToken } from '../utils/indexedDB';

const Home = () => {
    const [token, setToken] = useState(null);

    useEffect(() => {
        const fetchToken = async () => {
            const storedToken = await getToken(); // No need to pass username
            setToken(storedToken);
        };
        fetchToken();
    }, []);

    return (
        <div>
            <h2>Home Page</h2>
            {token ? <p>Logged in (Token: {token})</p> : <p>Please log in.</p>}
        </div>
    );
};

export default Home;
