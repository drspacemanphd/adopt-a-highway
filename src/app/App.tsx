import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify';

import { AuthContext } from '../contexts/AuthContext';
import { GlobalNav } from '../nav/GlobalNav';
import { AuthenticatorService } from '../services/authenticator-service';

import './App.css';

export function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      try {
        const { user } = await AuthenticatorService.getCredentials();
        setUser(user);
      } catch (err) {
        console.error('could-not-get-user-info', err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    Hub.listen('auth', (data) => {
      if (data.payload.event === 'signIn') {
        setUser(data.payload.data);
      } else if (data.payload.event === 'signOut') {
        setUser(null);
        navigate('/');
      }
    });
  }, [navigate]);
  
  return (
    <div className='app'>
      <AuthContext.Provider value={{ user: user }}>
        <GlobalNav />
        <Outlet />
      </AuthContext.Provider>
    </div>
  );
}
