import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, Image, Text, TouchableOpacity, Dimensions, Alert, RefreshControl, ActivityIndicator } from "react-native";
import Screen from "../../../components/Shared/Screen";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { typographyStyles } from "../../../constants";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth, storage } from "../../../lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import Loader from "../../../components/Shared/Loader";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function Settings() {
  const { user, dispatch } = useAuth() as authValue;
  const navigation = useNavigation<NavigationProp>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bio, setBio] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [savedPosts, setSavedPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [user])
  );

  async function fetchUserData() {
    try {
      if (!user?.uid) return;
      
      // Fetch user posts
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("userRef", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const userPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(userPosts);

      // Fetch followers and following from user document
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFollowers(userData.followers?.length || 0);
        setFollowing(userData.following?.length || 0);
        setBio(userData.bio || "");
        
        // Fetch saved posts
        const savedPostIds = userData.savedPosts || [];
        if (savedPostIds.length > 0) {
          const savedPostsData = await Promise.all(
            savedPostIds.map(async (postId: string) => {
              const postDoc = await getDoc(doc(db, "posts", postId));
              if (postDoc.exists()) {
                return { id: postDoc.id, ...postDoc.data() };
              }
              return null;
            })
          );
          setSavedPosts(savedPostsData.filter(post => post !== null));
        } else {
          setSavedPosts([]);
        }
      } else {
        setFollowers(0);
        setFollowing(0);
        setBio("");
        setSavedPosts([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setFollowers(0);
      setFollowing(0);
      setBio("");
      setSavedPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    if (!user?.uid) return;
    setRefreshing(true);
    fetchUserData();
  }, [user]);

  async function handleLogout() {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              dispatch({ type: "Logout", payload: null });
            } catch (error) {
              Alert.alert("Error", "Failed to logout");
            }
          }
        }
      ]
    );
  }

  function handleEditProfile() {
    navigation.navigate("EditProfile");
  }

  function handleFollowers() {
    if (user?.uid) {
      navigation.navigate("FollowersList", { userId: user.uid, type: "followers" });
    }
  }

  function handleFollowing() {
    if (user?.uid) {
      navigation.navigate("FollowersList", { userId: user.uid, type: "following" });
    }
  }

  function handleMessages() {
    navigation.navigate("Messages");
  }

  const changeProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant photo library permissions to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && user) {
        setUploadingPhoto(true);
        const imageUri = result.assets[0].uri;

        // Upload to Firebase Storage
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const filename = `profile_pictures/${user.uid}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);

        // Update Firebase Auth profile
        await updateProfile(user, {
          photoURL: downloadURL
        });

        // Update Firestore user document
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          photoUrl: downloadURL
        });

        // Refresh the page to show new photo
        await fetchUserData();
        
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <Screen>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#fff"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.username, typographyStyles.bold]}>
            {user?.displayName || "User"}
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={handleMessages} style={styles.iconButton}>
              <Ionicons name="mail-outline" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={changeProfilePicture} disabled={uploadingPhoto}>
            <View>
              <Image
                source={{
                  uri: user?.photoURL || "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png"
                }}
                style={styles.profileImage}
              />
              <View style={styles.cameraIconContainer}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="camera" size={20} color="white" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem} onPress={() => {}}>
              <Text style={[styles.statNumber, typographyStyles.bold]}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
              <Text style={[styles.statNumber, typographyStyles.bold]}>{followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
              <Text style={[styles.statNumber, typographyStyles.bold]}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.displayName, typographyStyles.bold]}>
            {user?.displayName || "User"}
          </Text>
          {bio ? (
            <Text style={styles.bioText}>{bio}</Text>
          ) : null}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={[styles.editButtonText, typographyStyles.md]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}
          >
            <MaterialCommunityIcons 
              name="grid" 
              size={24} 
              color={activeTab === "posts" ? "white" : "#666"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "saved" && styles.activeTab]}
            onPress={() => setActiveTab("saved")}
          >
            <Ionicons 
              name="bookmark-outline" 
              size={24} 
              color={activeTab === "saved" ? "white" : "#666"} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.postsGrid}>
          {activeTab === "posts" ? (
            posts.length === 0 ? (
              <View style={styles.noPostsContainer}>
                <MaterialCommunityIcons name="camera-outline" size={80} color="#555" />
                <Text style={styles.noPostsText}>No posts yet</Text>
              </View>
            ) : (
              posts.map((post, index) => (
                <Image
                  key={post.id || index}
                  source={{ uri: post.images?.[0] || "" }}
                  style={styles.gridImage}
                />
              ))
            )
          ) : (
            savedPosts.length === 0 ? (
              <View style={styles.noPostsContainer}>
                <Ionicons name="bookmark-outline" size={80} color="#555" />
                <Text style={styles.noPostsText}>No saved posts yet</Text>
                <Text style={styles.noPostsSubtext}>Save posts to view them later</Text>
              </View>
            ) : (
              savedPosts.map((post, index) => (
                <Image
                  key={post.id || index}
                  source={{ uri: post.images?.[0] || "" }}
                  style={styles.gridImage}
                />
              ))
            )
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  username: {
    color: "white",
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  iconButton: {
    marginRight: 5,
  },
  profileSection: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 30,
  },
  statsContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 18,
  },
  statLabel: {
    color: "#bbb",
    fontSize: 14,
    marginTop: 4,
  },
  bioSection: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  displayName: {
    color: "white",
    fontSize: 16,
    marginBottom: 2,
  },
  bioText: {
    color: "white",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 18,
  },
  email: {
    color: "#bbb",
    fontSize: 14,
  },
  editButton: {
    marginHorizontal: 15,
    marginVertical: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "white",
  },
  postsHeader: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridImage: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderWidth: 1,
    borderColor: "#000",
  },
  noPostsContainer: {
    width: width,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  noPostsText: {
    color: "#555",
    fontSize: 16,
    marginTop: 10,
  },
  noPostsSubtext: {
    color: "#555",
    fontSize: 14,
    marginTop: 5,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0095f6",
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#000",
  },
});
