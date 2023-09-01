import { AuthContext } from "../../contexts/AuthContext";
import { SignIn } from "../sign-in/SignIn";

export const ProtectedRoute = (Component: new(props: any) => React.Component<any, any, {}>, route: string) => {
  return () => {
    return (
      <AuthContext.Consumer>
        {
          ({ user }) => {
            if (!user) return <SignIn route={route} />;
            return <Component />;
          }
        }
      </AuthContext.Consumer>
    );
  };
};
