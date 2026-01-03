import React from "react";
import PostFooter from "./PostFooter";
import PostImages from "./PostImage";
import PostHeader from "./PostHeader";
import { View, StyleSheet } from "react-native";
import { IPost } from "../../../types";
type props = {
  postData: IPost;
  onUserPress?: (userId: string) => void;
};
export default function Post({ postData, onUserPress }: props) {
  const {
    user: { username, photoUrl },
    images,
    caption,
    id,
    userRef,
  } = postData;
  return (
    <View style={PostStyles.container}>
      <PostHeader 
        username={username} 
        photoUrl={photoUrl} 
        onPress={() => onUserPress?.(userRef)}
      />
      <PostImages images={images} />
      <PostFooter
        username={username}
        caption={caption}
        id={id}
        postOwnerId={userRef}
        postImage={images?.[0]}
      />
    </View>
  );
}
const PostStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
});
