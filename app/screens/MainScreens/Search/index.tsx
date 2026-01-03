import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  FlatList,
  Text,
  Image,
} from "react-native";
import Screen from "../../../components/Shared/Screen";
import React, { useState, useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import Picture from "../../../components/Search/Picture";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SearchResult {
  id: string;
  type: "user" | "post";
  username?: string;
  photoUrl?: string;
  imageUrl?: string;
  userId?: string;
}

export default function Search() {
  const navigation = useNavigation<NavigationProp>();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentPosts, setRecentPosts] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRecentPosts();
  }, []);

  const loadRecentPosts = async () => {
    try {
      const postsRef = collection(db, "posts");
      const postsSnapshot = await getDocs(postsRef);
      const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "post" as const,
          imageUrl: data.images?.[0] || "",
          userId: data.userRef,
        };
      });
      setRecentPosts(posts.slice(0, 30));
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    setIsSearching(text.length > 0);

    if (text.length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      // Search users by username
      const usersRef = collection(db, "users");
      const usersSnapshot = await getDocs(usersRef);
      
      const users = usersSnapshot.docs
        .filter(doc => {
          const username = doc.data().username?.toLowerCase() || "";
          const email = doc.data().email?.toLowerCase() || "";
          const searchLower = text.toLowerCase();
          return username.includes(searchLower) || email.includes(searchLower);
        })
        .map(doc => ({
          id: doc.id,
          type: "user" as const,
          username: doc.data().username || doc.data().email?.split("@")[0] || "User",
          photoUrl: doc.data().photoUrl || "",
          userId: doc.id,
        }));

      setSearchResults(users);
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  const handleUserPress = (userId: string) => {
    navigation.navigate("UserProfile", { userId });
  };

  const renderUserResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.userResult} 
      onPress={() => handleUserPress(item.userId!)}
    >
      <Image
        source={{ uri: item.photoUrl || "https://via.placeholder.com/50" }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userSubtext}>User</Text>
      </View>
      <Feather name="arrow-right" size={20} color="#666" />
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: SearchResult }) => (
    <Picture imageUrl={item.imageUrl} />
  );

  return (
    <Screen>
      <View style={styles.inputContainer}>
        <View style={styles.inputBox}>
          <TouchableOpacity style={styles.searchBtn}>
            <Feather name="search" color={"#bbb"} size={16} />
          </TouchableOpacity>
          <TextInput
            placeholder="Search users..."
            autoCorrect={false}
            placeholderTextColor={"#bbb"}
            style={styles.input}
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Feather name="x" color={"#bbb"} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderUserResult}
          keyExtractor={(item) => item.id}
          style={styles.usersList}
        />
      ) : isSearching && searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <FlatList
          data={recentPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.imageContainer}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  inputBox: {
    width: "90%",
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 6,
    flexDirection: "row",
  },
  input: {
    paddingHorizontal: 10,
    color: "#bbb",
  },
  imageContainer: {
    paddingHorizontal: 8,
  },
  searchBtn:{
    alignSelf:"center"
  },
  usersList: {
    flex: 1,
  },
  userResult: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userSubtext: {
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
});
