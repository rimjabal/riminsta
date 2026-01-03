import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "../../../lib/firebase";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function EditProfile() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth() as authValue;
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setDisplayName(userData.displayName || user.displayName || "");
        setUsername(userData.username || user.displayName || user.email?.split("@")[0] || "");
        setBio(userData.bio || "");
      } else {
        setDisplayName(user.displayName || "");
        setUsername(user.displayName || user.email?.split("@")[0] || "");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setDisplayName(user.displayName || "");
      setUsername(user.displayName || user.email?.split("@")[0] || "");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }

    try {
      setSaving(true);

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      // Update Firestore user document
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        username: username.trim() || displayName.trim(),
        displayName: displayName.trim(),
        bio: bio.trim(),
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#0095f6" />
          ) : (
            <Ionicons name="checkmark" size={28} color="#0095f6" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            placeholderTextColor="#666"
            maxLength={50}
          />
          <Text style={styles.helperText}>
            This is how your name will appear on your profile
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            placeholderTextColor="#666"
            autoCapitalize="none"
            maxLength={30}
          />
          <Text style={styles.helperText}>
            Your unique username for others to find you
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Write something about yourself..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            maxLength={150}
          />
          <Text style={styles.helperText}>
            {bio.length}/150 characters
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.disabledInput}>
            <Text style={styles.disabledText}>{user?.email}</Text>
          </View>
          <Text style={styles.helperText}>
            Email cannot be changed
          </Text>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  label: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  disabledText: {
    color: "#666",
    fontSize: 16,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
