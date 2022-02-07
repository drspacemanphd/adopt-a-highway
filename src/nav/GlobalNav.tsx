import {
  Button,
  IconLogin,
  IconMap,
  IconPhotoCamera,
} from '@aws-amplify/ui-react';
import { Auth } from 'aws-amplify';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

import './GlobalNav.css';

export function GlobalNav(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AuthContext.Consumer>
      {({ user }) => {
        return (
          <nav className='app-nav'>
            <div>ADOPT_A_HIGHWAY</div>
            <ul className='app-nav-links'>
              {/* Using Buttons instead of Links for more consistent styling for Amplify Signout
                per JSX eslint, sorry :( */}
              <li className='app-nav-link'>
                <Button
                  className={`app-nav-link-button${location.pathname === '/' ? '-active' : ''}`}
                  onClick={() => navigate('/')}
                >
                  <IconMap />
                  Map
                </Button>
              </li>
              <li className='app-nav-link'>
                <Button
                  className={`app-nav-link-button${location.pathname === '/upload' ? '-active' : ''}`}
                  onClick={() => navigate('/upload')}
                >
                  <IconPhotoCamera />
                  Upload
                </Button>
              </li>
              {user ? (
                <li className='app-nav-link'>
                  <Button
                    className='app-nav-link-button'
                    onClick={async () => {
                      await Auth.signOut();
                      navigate('/');
                    }}
                  >
                    <IconLogin />
                    Sign Out
                  </Button>
                </li>
              ) : null}
            </ul>
          </nav>
        );
      }}
    </AuthContext.Consumer>
  );
}
