import React, { useState } from "react";
import PostFooter from "./PostFooter";
import PostImages from "./PostImage";
import PostHeader from "./PostHeader";
import { View, StyleSheet, Alert, Modal, TouchableOpacity, Text } from "react-native";
import { IPost } from "../../../types";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../../lib/firebase";
import { ref, deleteObject } from "firebase/storage";
import { typographyStyles } from "../../../constants";
type props = {
  postData: IPost;
  onUserPress?: (userId: string) => void;
};
export default function Post({ postData, onUserPress }: props) {
  const { user } = useAuth() as authValue;
  const [showMenu, setShowMenu] = useState(false);
  const [editCaption, setEditCaption] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  
  const {
    user: { username, photoUrl },
    images,
    caption,
    id,
    userRef,
  } = postData;

  const isOwnPost = user?.uid === userRef;

  const handleDelete = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete image from storage
              if (images && images[0]) {
                const imageRef = ref(storage, images[0]);
                await deleteObject(imageRef).catch(() => {
                  // Image might not exist, continue anyway
                });
              }
              
              // Delete post document
              await deleteDoc(doc(db, "posts", id));
              
              setShowMenu(false);
              Alert.alert("Success", "Post deleted successfully");
            } catch (error) {
              console.error("Error deleting post:", error);
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    setNewCaption(caption);
    Alert.prompt(
      "Edit Caption",
      "Enter new caption",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (text) => {
            try {
              await updateDoc(doc(db, "posts", id), {
                caption: text || caption,
              });
              Alert.alert("Success", "Caption updated successfully");
            } catch (error) {
              console.error("Error updating caption:", error);
              Alert.alert("Error", "Failed to update caption");
            }
          },
        },
      ],
      "plain-text",
      caption
    );
  };

  return (
    <View style={PostStyles.container}>
      <PostHeader 
        username={username} 
        photoUrl={photoUrl} 
        onPress={() => onUserPress?.(userRef)}
        onMenuPress={() => setShowMenu(true)}
        isOwnPost={isOwnPost}
      />
      <PostImages images={images} />
      <PostFooter
        username={username}
        caption={caption}
        id={id}
        postOwnerId={userRef}
        postImage={images?.[0]}
      />

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={PostStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={PostStyles.menuContainer}>
            <TouchableOpacity 
              style={PostStyles.menuItem}
              onPress={handleEdit}
            >
              <Text style={[PostStyles.menuText, typographyStyles.md]}>Edit Caption</Text>
            </TouchableOpacity>
            
            <View style={PostStyles.menuDivider} />
            
            <TouchableOpacity 
              style={PostStyles.menuItem}
              onPress={handleDelete}
            >
              <Text style={[PostStyles.menuText, PostStyles.deleteText, typographyStyles.md]}>Delete Post</Text>
            </TouchableOpacity>
            
            <View style={PostStyles.menuDivider} />
            
            <TouchableOpacity 
              style={PostStyles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[PostStyles.menuText, typographyStyles.md]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const PostStyles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#262626',
    borderRadius: 12,
    width: '80%',
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuText: {
    color: 'white',
    fontSize: 16,
  },
  deleteText: {
    color: '#ff4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#3a3a3a',
  },
});
