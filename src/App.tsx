import React from 'react';
import logo from './logo.svg';
import { API, Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react'

import './App.css';

class App extends React.Component {
  async componentWillMount() {
    await API.get('SubmissionApi', '/', {
      headers: {
        Authorization: `Bearer ${(await Auth.currentSession()).getIdToken().getJwtToken()}`,
        'Content-Type': 'application/json'
      }
    });
  }

  render () {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <br />
          <AmplifySignOut />
        </header>
      </div>
    );
  }
}

export default withAuthenticator(App);
