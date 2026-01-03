import { View, Image, StyleSheet } from "react-native";
import { getDeviceWidth } from "../../../utils";
const ITEM_WIDTH = getDeviceWidth();

interface PictureProps {
  imageUrl?: string;
}

export default function Picture({ imageUrl }: PictureProps) {
  return (
    <View style={styles.pictureContainer}>
      <Image
        source={{ uri: imageUrl || "https://picsum.photos/300" }}
        style={styles.picture}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  pictureContainer: {
    width: "33%",
    margin: 1,
  },
  picture: {
    height: 200,
    width: ITEM_WIDTH * 0.325 ,
    resizeMode:"cover"
  },
});
