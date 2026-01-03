import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Loader from "../../../components/Shared/Loader";

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, "FollowersList">;

interface UserItem {
  id: string;
  username: string;
  photoUrl: string;
  displayName: string;
}

export default function FollowersList() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId, type } = route.params;
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [userId, type]);

  const fetchUsers = async () => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userIds = type === "followers" 
          ? userData.followers || [] 
          : userData.following || [];
        
        // Fetch user data for each ID
        const usersData = await Promise.all(
          userIds.map(async (uid: string) => {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const data = userSnap.data();
              return {
                id: uid,
                username: data.username || data.email?.split("@")[0] || "User",
                displayName: data.displayName || data.username || "User",
                photoUrl: data.photoUrl || "",
              };
            }
            return null;
          })
        );
        
        setUsers(usersData.filter(user => user !== null) as UserItem[]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (uid: string) => {
    navigation.navigate("UserProfile", { userId: uid });
  };

  const renderUser = ({ item }: { item: UserItem }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleUserPress(item.id)}
    >
      <Image
        source={{ uri: item.photoUrl || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{item.displayName}</Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "followers" ? "Followers" : "Following"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={type === "followers" ? "people-outline" : "person-add-outline"} 
            size={80} 
            color="#555" 
          />
          <Text style={styles.emptyText}>
            {type === "followers" ? "No followers yet" : "Not following anyone yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  username: {
    color: "#999",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "#555",
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
});
