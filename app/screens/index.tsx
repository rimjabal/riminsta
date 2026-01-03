import { createStackNavigator } from "@react-navigation/stack";
import Login from "./AuthScreens/Login";
import Register from "./AuthScreens/Register";
import Main from "./MainScreens/Main";
import {Feather} from '@expo/vector-icons';
import Comments from "./MainScreens/Comments";
import UserProfile from "./MainScreens/UserProfile";
import Messages from "./MainScreens/Messages";
import Chat from "./MainScreens/Chat";
import Notifications from "./MainScreens/Notifications";
import CreateStory from "./MainScreens/CreateStory";
import EditProfile from "./MainScreens/EditProfile";
import FollowersList from "./MainScreens/FollowersList";
import Welcome from "./AuthScreens/Welcome";
import useAuth,{authValue} from '../hooks/useAuth';
export type RootStackParamList = {
  Welcome:undefined;
  Main: undefined;
  Login:undefined;
  Register:undefined;
  Comments:{
    id:string
  };
  UserProfile: {
    userId: string;
  };
  Messages: undefined;
  Chat: {
    conversationId: string;
    otherUserId: string;
  };
  Notifications: undefined;
  CreateStory: undefined;
  EditProfile: undefined;
  FollowersList: {
    userId: string;
    type: "followers" | "following";
  };
};
export default function Screens() {
  const Stack = createStackNavigator<RootStackParamList>();
  const {user} = useAuth() as authValue;
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:false
      }}
     
    >{
      user?(
      <Stack.Group screenOptions={{animationTypeForReplace:'pop',}}>
      <Stack.Screen name="Main" component={Main} />
      <Stack.Screen name="Comments" component={Comments}/>
      <Stack.Screen name="UserProfile" component={UserProfile}/>
      <Stack.Screen name="Messages" component={Messages}/>
      <Stack.Screen name="Chat" component={Chat}/>
      <Stack.Screen name="Notifications" component={Notifications}/>
      <Stack.Screen name="CreateStory" component={CreateStory}/>
      <Stack.Screen name="EditProfile" component={EditProfile}/>
      <Stack.Screen name="FollowersList" component={FollowersList}/>
      </Stack.Group>
      ):(
      <Stack.Group>
      <Stack.Screen name="Welcome" component={Welcome}/>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      </Stack.Group>
      )
      }
    </Stack.Navigator>
  );
}

