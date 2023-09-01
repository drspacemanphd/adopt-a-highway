import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Spinner from "react-bootstrap/Spinner";
import { AuthenticatorService } from "../../services/authenticator-service";

import "./SignIn.css";

export const SignIn = (props: { route?: string }) => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="route-layout" id="sign-in">
      <div className="sign-in-dialog">
        <Form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            const email = document.getElementById("sign-in-email");
            const password = document.getElementById("sign-in-password");

            try {
              await AuthenticatorService.signIn(
                (email as any).value,
                (password as any).value
              );
              navigate(props.route || "/map");
            } catch (err) {
              setSubmitting(false);
             }
          }}
        >
          <Form.Group className="mb-3" controlId="sign-in-email">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="Email"/>
          </Form.Group>
          <Form.Group className="mb-3" controlId="sign-in-password">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" />
          </Form.Group>
          <span style={{display: 'inline-block'}}>
            <Button
              className={submitting ? "submit-active" : "submit"}
              type='submit'
            >
              Sign In
            </Button>
            {submitting ? <Spinner size="sm" style={{marginLeft: '0.75rem', color: 'rgb(4,75,100)'}} /> : null}
          </span>
        </Form>
      </div>
    </div>
  );
};
