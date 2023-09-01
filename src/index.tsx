import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Amplify from 'aws-amplify';

import { App } from './app/App';
import { Upload } from './routes/upload/Upload';
import { Map } from './routes/map/Map';
import { SignIn } from './routes/sign-in/SignIn';

import reportWebVitals from './reportWebVitals';
import awsExports from './aws-exports';

import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Configure Amplify
Amplify.configure(awsExports);

// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;

// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);

// We listen to the resize event
window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}>
          <Route index element={<Map />}/>
          <Route path='/map' element={<Map />}/>
          <Route path='/upload' element={<Upload />}/>
          <Route path='/sign-in' element={<SignIn />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
