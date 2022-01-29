import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Amplify from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";

import App from "./routes/app/App";
import Upload from "./routes/upload/Upload";

import reportWebVitals from "./reportWebVitals";
import awsExports from "./aws-exports";

import "./index.css";
import "@aws-amplify/ui-react/styles.css";

// Configure Amplify
Amplify.configure(awsExports);

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route
            path="/upload"
            element={
              <Authenticator>
                {({ signOut, user }) => <Upload />}
              </Authenticator>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
