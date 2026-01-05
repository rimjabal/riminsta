import { TouchableOpacity, View, StyleSheet,Image, Text } from "react-native";
import {MaterialCommunityIcons} from '@expo/vector-icons';
import { typographyStyles } from "../../../constants";
type props ={
  username: string;
  photoUrl: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  isOwnPost?: boolean;
}
export default function PostHeader({
    username,
    photoUrl,
    onPress,
    onMenuPress,
    isOwnPost,
  }: props) {
    return (
      <View style={PostHeaderStyles.container}>
        <TouchableOpacity style={PostHeaderStyles.userContainer} onPress={onPress}>
          <Image
            source={{ uri: `${photoUrl.length ? photoUrl : "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png"}` }}
            style={PostHeaderStyles.profileImg}
          />
          <Text style={[PostHeaderStyles.profileUsername,typographyStyles.bold]}>{username}</Text>
        </TouchableOpacity>
        {isOwnPost && (
          <TouchableOpacity onPress={onMenuPress}>
            <MaterialCommunityIcons
              name="dots-horizontal"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }
  const PostHeaderStyles = StyleSheet.create({
    container: {
      flexDirection: "row",
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      marginVertical:10,
    },
    userContainer:{
      flexDirection: "row",
      alignItems:'center',
    },
    profileImg: {
      height: 40,
      width: 40,
      borderRadius: 20,
      resizeMode: "contain",
      marginRight: 10,
    },
    profileUsername: {
      fontWeight: "600",
      fontSize: 16,
      color: "white",
     textDecorationLine:"underline",
     textDecorationColor:"#fff"
    },
  });