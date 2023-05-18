// App.js
import React, {ChangeEvent, Component, FormEvent, Fragment} from 'react';
import './App.css';
import Amplify from 'aws-amplify'
import {Auth, Hub} from 'aws-amplify';
import {CognitoUser} from '@aws-amplify/auth';
import {Pet} from "../model/pet";
import {User} from "../model/user";
import {APIService} from "../service/APIService";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { initiate } from './TenantAPI';
import jwt_decode from "jwt-decode";


const numberFormat = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

interface AppProps {
  apiService: APIService
}

export interface State {
  authState?: 'signedIn' | 'signedOut' | 'loading';
  user?: User;
  pets?: Pet[];
  error?: any;
  message?: string;
  selectedPet?: Pet;
  loading?: boolean;
  inputValue?: string;
  token: any;
}
 const REST_API_NAME = "main";
 const TENANT_API_NAME = "tenantAPI";

class App extends Component<AppProps, State> {

  private apiService: APIService;

  constructor(props: AppProps) {

    super(props);

    this.apiService = props.apiService;

    this.state = {
      authState: 'loading',
      token: ''
    }
  }

  async componentDidMount() {
    console.log("componentDidMount");
    try{
    const getConfigResponse = await fetch('./uiConfig.json');
    const autoGenConfig = await getConfigResponse.json();

    const amplifyConfig = {
      Auth: {

        // REQUIRED - Amazon Cognito Region
        region: autoGenConfig.region,
    
        // OPTIONAL - Amazon Cognito User Pool ID
        userPoolId: autoGenConfig.cognitoUserPoolId,
    
        // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
        userPoolWebClientId: autoGenConfig.cognitoUserPoolAppClientId,
    
        // OPTIONAL - Enforce user authentication prior to accessing AWS resources or not
        // mandatorySignIn: false,
    
        oauth: {
    
          domain: autoGenConfig.cognitoDomain,
    
          scope: ['phone', 'email', 'openid', 'profile'],
    
          redirectSignIn: autoGenConfig.appUrl,
    
          redirectSignOut: autoGenConfig.appUrl,
    
          responseType: 'code', // or token
    
          // optional, for Cognito hosted ui specified options
          options: {
            // Indicates if the data collection is enabled to support Cognito advanced security features. By default, this flag is set to true.
            AdvancedSecurityDataCollectionFlag: true
          }
        }
      },
    
      API: {
        endpoints: [
          {
            name: REST_API_NAME,
            endpoint: autoGenConfig.apiUrl // for local test change to something such as 'http://localhost:3001'
          },
          {
            name: TENANT_API_NAME ,
            endpoint: autoGenConfig.tenantApiUrl
          }
        ]
      }
    };

    Amplify.configure(amplifyConfig);
  } catch(error) {
    console.error(error);
  }
    Hub.listen('auth', async ({payload: {event, data}}) => {
      switch (event) {
        case 'cognitoHostedUI':
          let user = await this.getUser();
          // workaround for FF bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1422334
          // eslint-disable-next-line
          // noinspection SillyAssignmentJS
          window.location.hash = window.location.hash;
          this.setState({authState: 'signedIn', user: user});
          this.getToken();
          break;
        case 'cognitoHostedUI_failure':
          this.setState({authState: 'signedOut', user: null, error: data});
          break;
        default:
          break;
      }
    });

    // if the URL contains ?identity_provider=x, and the user is signed out, we redirect to the IdP on load
  //  const urlParams = new URLSearchParams(window.location.search);
  //  const idpParamName = 'identity_provider';
  //  const idp = urlParams.get(idpParamName);

    try {
      let user = await this.getUser();

      // remove identity_provider query param (not needed if signed in successfully)
    //  if (idp) {
    //    urlParams.delete(idpParamName);
    //    const params = urlParams.toString();
    //    window.history.replaceState(null, null, window.location.pathname + (params ? '?' + params : ''));
    //  }

      this.setState({authState: 'signedIn', user: user});
      this.getToken();
    } catch (e) {
      // user is not authenticated, and we have an IdP in the request
      //if (e === 'not authenticated' && idp) {
      //  await Auth.federatedSignIn({customProvider: idp});
     /// } else {
      //  console.warn(e);
      //  this.setState({authState: 'signedOut', user: null});
     // }
    }
  }

  private async getToken() {
    Auth.currentSession().then(res => {
      const decodedIdtoken = jwt_decode(res.getIdToken().getJwtToken());
     this.setState({ token: decodedIdtoken });
    });
  }

  private async getUser() {
    let cognitoUser: CognitoUser = await Auth.currentAuthenticatedUser();
    return new User(cognitoUser);
  }

  async componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<State>) {
    if (prevState.authState !== this.state.authState && this.state.authState === "signedIn") {
      await this.getAllPets();
    }
  }

  render() {

    const {authState, pets, user, error, selectedPet, message, loading}: Readonly<State> = this.state;

    let username: string;
    let domain: string
    let groups: string[] = [];
    if(user) {
      // using first name for display
      username = user.name || user.email;
      groups = user.groups;
      domain = user.domain;
    }
    return (
      <Fragment>
        <nav className="navbar navbar-expand-md navbar-dark bg-dark">

          <a className="navbar-brand" href="/">Amazon Cognito + AWS Amplify + React Demo</a>

          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault"
                  aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"/>
          </button>


          <div className="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item active">
                <a className="nav-link" href="/">Home <span className="sr-only">(current)</span></a>
              </li>

            </ul>
            <span className="navbar-brand">{domain}</span>
            {[...groups].map(group =>
              <span className={`badge badge-${group.endsWith("admins") ? "success" : "info"} mr-2`}
                    key={group}>{group}</span>)}

            <div className="my-2 my-lg-0 navbar-nav">


              {authState === 'loading' && (<div>loading...</div>)}
              
	      {authState === 'signedIn' &&
              <div className="nav-item dropdown">
                <button className="nav-link dropdown-toggle btn btn-link" data-toggle="dropdown">{username}</button>
                <div className="dropdown-menu dropdown-menu-right">
                  <button className="dropdown-item btn btn-warning" onClick={() => this.signOut()}>Sign Out</button>
                </div>
              </div>
              }

            </div>
          </div>
        </nav>

        <div className="container-fluid">

	{authState !== 'signedIn' &&
                <Card bg="info" border="dark" className="text-center" text="white" style={{ width: '18rem', top:'10rem', left: '20rem' }}>
                        <Card.Body>
                        <Card.Header bsPrefix="dark"><h3>Sign In</h3></Card.Header>
                        <hr />
                        <Form.Label htmlFor="inputPassword5">Please enter your email domain</Form.Label>
                        <Form.Control
                                type="text"
                                id="inputEmail"
                                value={this.state.inputValue}
                                onChange={evt => this.updateInputValue(evt)}
                        />
                        <br />
                        <Button variant="dark" onClick={() => this.initiateLogin(this.state.inputValue)}>Sign In</Button>
                        </Card.Body>
                </Card>
             }	

          {error &&
          <div className="alert alert-warning" onClick={() => this.setState({error: null})}>{error.toString()}</div>}

          {message &&
          <div className="alert alert-info" onClick={() => this.setState({message: null})}>{message.toString()}</div>}

       

          {authState === 'signedIn' && <div className="container">
            {pets &&
            <table className="table">
              <thead>
              <tr>
                <th>owner</th>
                <th>type</th>
                <th>price</th>
              </tr>

              </thead>
              <tbody>
              {pets.map(pet =>
                <tr id={"row" + pet.id} key={pet.id}
                    onClick={() => this.setState({selectedPet: pet})}
                    className={selectedPet && pet.id === selectedPet.id ? "table-active" : ""}
                >
                  <td><span className='badge badge-secondary'>{pet.ownerDisplayName}</span></td>
                  <td><strong>{pet.type}</strong></td>
                  <td>{numberFormat.format(pet.price || 0)}</td>
                </tr>)
              }
              </tbody>
            </table>}


            {selectedPet && selectedPet.id &&
            <button className="btn btn-danger m-1" onClick={() => this.deletePet()}>Delete</button>}

            {<button className="btn btn-primary m-1" onClick={() => this.newOnClick()}>Create New</button>}

            {<button className="btn btn-success m-1" onClick={() => this.getAllPets()}>Reload</button>}


            {selectedPet &&
            <div className="card">
              <div className="card-body">
                <form className="form-inline" onSubmit={e => this.savePet(e)}>
                  <input className="form-control" type="hidden" value={selectedPet.id || ""} placeholder="Id"
                         onChange={e => this.handleChange(e, (state, value) => state.selectedPet.id = value)}/>
                  <input className="form-control" type="text" value={selectedPet.type || ""} placeholder="Type"
                         onChange={e => this.handleChange(e, (state, value) => state.selectedPet.type = value)}/>
                  <input className="form-control" type="text" value={selectedPet.price || ""} placeholder="Price"
                         onChange={e => this.handleChange(e, (state, value) => state.selectedPet.price = this.getAsNumber(value))}/>
                  <button type="submit" className="btn btn-success m-1">{selectedPet.id ? "Update" : "Save"}</button>

                </form>

              </div>
  	     
               </div>}


            {loading && <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>}


          </div>}

        </div>


      </Fragment>
    );
  }

  handleChange(event: ChangeEvent<HTMLInputElement>, mapper: (state: State, value: any) => void) {
    const value = event.target.value;
    this.setState(state => {
      mapper(state, value);
      return state;
    });
  }

  newOnClick() {
    // we explicitly set to null, undefined causes react to assume there was no change
    this.setState({selectedPet: new Pet()});

  }

   updateInputValue(evt: any) {
    const val = evt.target.value;
    this.setState({
      inputValue: val
    });
  }

   async getAllPets() {
    try {
      this.setState({loading: true, selectedPet: undefined});
      let pets: Pet[] = await this.apiService.getAllPets();
      this.setState({pets, loading: false});
    } catch (e) {
      console.log(e);
      this.setState({error: `Failed to load pets: ${e}`, pets: [], loading: false});
    }
  }

  async savePet(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();


    const pet = this.state.selectedPet;

    if (!pet) {
      this.setState({error: "Pet is needed"});
      return;
    }
    try {
      this.setState({loading: true});
      await this.apiService.savePet(pet);

      await this.getAllPets();
    } catch (e) {
      this.setState({error: "Failed to save pet. " + e.message, loading: false});
    }
  }


 async initiateLogin(emailAddr: string) {
    try {
      await initiate(emailAddr);
    } catch (e) {
      console.error(e);
      this.setState({error: e.message, loading: false});
    }
  }


//async initiateLogin(emailAddr: string) {
//    try {
//     let idp : string; 
//    if(emailAddr.indexOf("okta.com")!== -1){
//         idp = "okta-idp";   
//    } else if (emailAddr.indexOf("2600nj.org")!== -1){
//         idp = "GAWorkspace";

//    } else if(emailAddr.indexOf("amazon.com")!== -1){
//	idp = "Okta-New";
//    } else if(emailAddr.indexOf("iotsecbuilders.com")!== -1){
//        idp = "iotsecbuilders";
    
//    }
//     Auth.federatedSignIn({ customProvider: idp });

//    } catch (e) {
//      console.error(e);
//    }
//  }


  async deletePet() {

    if (!window.confirm("Are you sure?")) {
      return;
    }
    const pet = this.state.selectedPet;

    if (!pet) {
      this.setState({error: "Pet is needed"});
      return;
    }
    try {
      this.setState({loading: true});
      await this.apiService.deletePet(pet);
      return this.getAllPets();
    } catch (e) {
      this.setState({error: "Failed to save pet. " + e.message, loading: false});
    }
  }

  async signOut() {
    try {
      this.setState({authState: 'signedOut', pets: null, user: null});
      await this.apiService.forceSignOut();
    } catch (e) {
      console.log(e);
    }
  }

  private getAsNumber(value: any): number | undefined {
    if (value) {
      try {
        return parseInt(value)
      } catch (ignored) {
      }
    }
    return undefined;
  }
}

export default App;
