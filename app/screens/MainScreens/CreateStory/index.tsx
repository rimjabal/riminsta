import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function CreateStory() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth() as authValue;
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to add a story.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera permissions to take a photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadStory = async () => {
    if (!image || !user) return;

    try {
      setUploading(true);

      // Upload image to Firebase Storage
      const response = await fetch(image);
      const blob = await response.blob();
      const filename = `stories/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Create story document in Firestore
      await addDoc(collection(db, "stories"), {
        userId: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "User",
        image: downloadURL,
        userPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Story posted!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error uploading story:", error);
      Alert.alert("Error", "Failed to upload story. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <View style={{ width: 32 }} />
      </View>

      {!image ? (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={takePhoto}>
            <Ionicons name="camera" size={50} color="white" />
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
            <Ionicons name="images" size={50} color="white" />
            <Text style={styles.optionText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setImage(null)}
            >
              <Ionicons name="trash" size={24} color="white" />
              <Text style={styles.actionText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.postButton]} 
              onPress={uploadStory}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="white" />
                  <Text style={styles.actionText}>Post Story</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  optionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
  },
  optionButton: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    width: 200,
  },
  optionText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "600",
  },
  previewContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  previewImage: {
    flex: 1,
    width: "100%",
    resizeMode: "contain",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  actionButton: {
    alignItems: "center",
    padding: 15,
    backgroundColor: "#333",
    borderRadius: 12,
    minWidth: 120,
  },
  postButton: {
    backgroundColor: "#0095f6",
  },
  actionText: {
    color: "white",
    fontSize: 14,
    marginTop: 5,
    fontWeight: "600",
  },
});
