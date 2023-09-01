import { useNavigate } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

import { AuthContext } from '../contexts/AuthContext';
import { AuthenticatorService } from '../services/authenticator-service';

import './GlobalNav.css';

export function GlobalNav(): JSX.Element {
  const navigate = useNavigate();

  return (
    <AuthContext.Consumer>
      {({ user }) => {
        return (
          <nav className='app-nav'>
            <DropdownButton
              title='Menu'
            >
              <Dropdown.Item
                eventKey={'Map'}
                onClick={() => navigate('/map')}
              >
                Map
              </Dropdown.Item>
              <Dropdown.Item
                eventKey={'Upload'}
                onClick={() => navigate('/upload')}
              >
                Upload
              </Dropdown.Item>
              {
              user
                ? <Dropdown.Item
                    eventKey={'SignOut'}
                    onClick={async () => await AuthenticatorService.signOut()}
                  >
                    Sign Out
                  </Dropdown.Item>
                : <Dropdown.Item
                    eventKey={'SignIn'}
                    onClick={() => navigate('/sign-in')}
                  >
                    Sign In
                  </Dropdown.Item>
              }
            </DropdownButton>
          </nav>
        );
      }}
    </AuthContext.Consumer>
  );
}
