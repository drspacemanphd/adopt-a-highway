import {
  IconLogin,
  IconMap,
  IconPhotoCamera,
  Menu,
  MenuItem
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
            <Menu className='app-nav-menu'>
              <MenuItem
                onClick={() => navigate('/')}
                className={location.pathname === '/' ? 'app-nav-menu-item active' : 'app-nav-menu-item'}
              >
                <IconMap className='app-nav-menu-item-icon' />
                Map
              </MenuItem>
              <MenuItem
                onClick={() => navigate('/upload')}
                className={location.pathname === '/upload' ? 'app-nav-menu-item active' : 'app-nav-menu-item'}
              >
                <IconPhotoCamera className='app-nav-menu-item-icon' />
                Upload
              </MenuItem>
              {user ?
                <MenuItem
                  onClick={async () => {
                    await Auth.signOut();
                    navigate('/');
                  }}
                  >
                    <IconLogin className='app-nav-menu-item-icon' />
                    Sign Out
                </MenuItem>
                : null}
            </Menu>
          </nav>
        );
      }}
    </AuthContext.Consumer>
  );
}
