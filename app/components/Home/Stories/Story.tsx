import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../screens";

type NavigationProp = StackNavigationProp<RootStackParamList>;

type props = {
  image: string;
  name: string;
  id: string;
};
export default function Story({ image, name, id }: props) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (id === "-1") {
      // Navigate to create story screen
      navigation.navigate("CreateStory");
    } else {
      // View other user's story
      console.log(`Viewing ${name}'s story`);
    }
  };

  return (
    <TouchableOpacity style={storyStyles.container} onPress={handlePress} activeOpacity={0.7}>
      <View
        style={[
          storyStyles.imageContainer,
          {
            borderColor: `${id !== "-1" ? "#f54266" : "transparent"}`,
            overflow: `${id === "-1" ? "visible" : "hidden"}`,
          },
        ]}
      >
        <Image source={{ uri: `${image}` }} style={storyStyles.image} />
        {id === `-1` && (
          <View style={storyStyles.plusIcon}>
            <MaterialCommunityIcons name="plus" size={16} color={'white'} />
          </View>
        )}
      </View>
      <Text numberOfLines={1} style={[storyStyles.text,{ color:`${id === "-1"?'white':"#ccc"}`}]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
}
const storyStyles = StyleSheet.create({
  container: {
    marginRight: 10,
    marginVertical: 0,
  },
  imageContainer: {
    height: 90,
    width: 90,
    padding: 2,
    backgroundColor: "black",
    marginBottom: 10,
    borderRadius: 45,
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: 40,
    resizeMode: "contain",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  plusIcon: {
    position: "absolute",
    bottom: 0,
    right: 2,
    zIndex: 2,
    backgroundColor: "#3797EF",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    height: 20,
    width: 20,
  },
});
