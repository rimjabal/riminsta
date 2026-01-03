import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, StyleSheet, View, Image, Text, TouchableOpacity, Dimensions, Alert, RefreshControl } from "react-native";
import Screen from "../../../components/Shared/Screen";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { typographyStyles } from "../../../constants";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Loader from "../../../components/Shared/Loader";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

type Props = StackScreenProps<RootStackParamList, "UserProfile">;

export default function UserProfile({ route, navigation }: Props) {
  const { userId } = route.params;
  const { user: currentUser } = useAuth() as authValue;
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [userId])
  );

  async function fetchUserData() {
    try {
      // Fetch user data
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFollowers(data.followers?.length || 0);
        setFollowing(data.following?.length || 0);
        
        // Check if current user is following this user
        if (currentUser) {
          setIsFollowing(data.followers?.includes(currentUser.uid) || false);
        }
      }

      // Fetch user posts
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("userRef", "==", userId));
      const querySnapshot = await getDocs(q);
      const userPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [userId]);

  async function handleFollowToggle() {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", userId);
      const currentUserDocRef = doc(db, "users", currentUser.uid);

      if (isFollowing) {
        // Unfollow
        await updateDoc(userDocRef, {
          followers: arrayRemove(currentUser.uid)
        });
        await updateDoc(currentUserDocRef, {
          following: arrayRemove(userId)
        });
        setFollowers(prev => prev - 1);
        setIsFollowing(false);
      } else {
        // Follow
        await updateDoc(userDocRef, {
          followers: arrayUnion(currentUser.uid)
        });
        await updateDoc(currentUserDocRef, {
          following: arrayUnion(userId)
        });
        setFollowers(prev => prev + 1);
        setIsFollowing(true);

        // Create follow notification
        await addDoc(collection(db, "notifications"), {
          type: "follow",
          fromUserId: currentUser.uid,
          fromUsername: currentUser.displayName || currentUser.email?.split("@")[0] || "Someone",
          fromUserPhoto: currentUser.photoURL || "",
          toUserId: userId,
          createdAt: serverTimestamp(),
          read: false,
        });
      }
      
      // Refresh data after follow/unfollow
      await fetchUserData();
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status");
    }
  }

  function handleFollowers() {
    navigation.navigate("FollowersList", { userId, type: "followers" });
  }

  function handleFollowing() {
    navigation.navigate("FollowersList", { userId, type: "following" });
  }

  async function handleMessage() {
    if (!currentUser) return;

    try {
      // Create or get existing conversation
      const conversationsRef = collection(db, "conversations");
      const q = query(
        conversationsRef,
        where("participants", "array-contains", currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      let conversationId = "";
      
      // Check if conversation already exists
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId)) {
          conversationId = doc.id;
        }
      });

      // Create new conversation if doesn't exist
      if (!conversationId) {
        const newConversation = await addDoc(conversationsRef, {
          participants: [currentUser.uid, userId],
          participantData: {
            [currentUser.uid]: {
              username: currentUser.displayName,
              photoUrl: currentUser.photoURL,
            },
            [userId]: {
              username: userData?.username,
              photoUrl: userData?.photoUrl,
            }
          },
          lastMessage: "",
          lastMessageTime: new Date(),
          unreadCount: 0,
        });
        conversationId = newConversation.id;
      }

      navigation.navigate("Chat", { conversationId, otherUserId: userId });
    } catch (error) {
      console.error("Error creating conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    }
  }

  if (loading) return <Loader />;
  if (!userData) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </Screen>
    );
  }

  const isOwnProfile = currentUser?.uid === userId;

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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={[styles.username, typographyStyles.bold]}>
            {userData?.username || "User"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: userData?.photoUrl || "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png"
            }}
            style={styles.profileImage}
          />
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, typographyStyles.bold]}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
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
            {userData?.username || "User"}
          </Text>
          {userData?.email && <Text style={styles.email}>{userData.email}</Text>}
        </View>

        {/* Follow/Message Buttons */}
        {!isOwnProfile && (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]} 
              onPress={handleFollowToggle}
            >
              <Text style={[styles.actionButtonText, typographyStyles.md]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Text style={[styles.actionButtonText, typographyStyles.md]}>Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Posts Grid */}
        <View style={styles.postsHeader}>
          <MaterialCommunityIcons name="grid" size={24} color="white" />
        </View>
        
        <View style={styles.postsGrid}>
          {posts.length === 0 ? (
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
  email: {
    color: "#bbb",
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: "row",
    marginHorizontal: 15,
    marginVertical: 10,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  followButton: {
    backgroundColor: "#0095f6",
    borderColor: "#0095f6",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderColor: "#333",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#bbb",
    fontSize: 18,
  },
});
