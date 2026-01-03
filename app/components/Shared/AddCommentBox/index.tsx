import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
import { IComments } from "../../../types";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { theme } from "../../../constants";
type props = {
  id: string;
};
export default function AddCommentBox({ id }: props) {
  const { user } = useAuth() as authValue;
  const [comment, setComment] = useState("");
  const [postOwnerId, setPostOwnerId] = useState<string | null>(null);
  const [postImage, setPostImage] = useState<string>("");
  const emojis = ["🔥", "😀", "😊", "👍", "❤️", "😂", "🙌", "😎"];

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", id));
        if (postDoc.exists()) {
          const data = postDoc.data();
          setPostOwnerId(data.userRef);
          setPostImage(data.images?.[0] || "");
        }
      } catch (error) {
        console.error("Error fetching post data:", error);
      }
    };
    fetchPostData();
  }, [id]);
  async function handlePost() {
    try {
      if (comment.length && user !== null) {
        const commentToSend = comment;
        setComment("");
        const newComment: IComments = {
          comment: commentToSend,
          user: {
            username: user.displayName as string,
            photoUrl: user.photoURL ?? "",
          },
          timestamp: serverTimestamp(),
        };
        const commentsCollectionRef = collection(db, "posts", id, "comments");
        await addDoc(commentsCollectionRef, newComment);

        // Create notification if not own post
        if (postOwnerId && postOwnerId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            type: "comment",
            fromUserId: user.uid,
            fromUsername: user.displayName || user.email?.split("@")[0] || "Someone",
            fromUserPhoto: user.photoURL || "",
            toUserId: postOwnerId,
            postId: id,
            postImage: postImage,
            commentText: commentToSend,
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      } else {
        throw new Error("the comment box cannot be empty");
      }
    } catch (err) {
      let message = "falied to send comment";
      if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert("comment upload failed", message);
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContent}
    >
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.emojiView}
        >
          {emojis.map((emoji, index) => (
            <TouchableOpacity
              style={styles.emojiContainer}
              key={index}
              onPress={() => setComment((prevState) => prevState + emoji)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.bottomContainer}>
          <View style={styles.userImage}>
            <Image
              style={{ height: 50, width: 50 }}
              source={{
                uri:
                  user?.photoURL ??
                  "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png",
              }}
            />
          </View>
          <View style={styles.commentBox}>
            <TextInput
              placeholder="Add a Comment..."
              placeholderTextColor={"#555"}
              value={comment}
              onChangeText={setComment}
              autoCorrect
              keyboardType="default"
              style={{ flex: 0.8, color: "white" }}
            />
            <TouchableOpacity onPress={handlePost}>
              <Text style={styles.postBtn}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    bottom: 0,
    position: "absolute",
    borderTopColor: "#555",
    borderTopWidth: 1,
    paddingHorizontal: 5,
    width: "100%",
    backgroundColor: "#000",
  },
  emojiView: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "flex-start",
  },
  emojiContainer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  emoji: {
    fontSize: 30,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingBottom: "5%",
  },
  commentBox: {
    borderColor: "#555",
    borderWidth: 1,
    flex: 0.9,
    borderRadius: 30,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postBtn: {
    color: theme.colors.secondaryBlue,
    textDecorationLine: "underline",
    textDecorationColor: theme.colors.secondaryBlue,
  },
  userImage: {
    marginRight: 20,
    height: 50,
    width: 50,
    overflow: "hidden",
    borderRadius: 30,
    alignItems: "center",
  },
});
