import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Text, Image, TouchableOpacity } from "react-native";
import Screen from "../../../components/Shared/Screen";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, onSnapshot, orderBy, or } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { typographyStyles } from "../../../constants";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../../components/Shared/Loader";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Conversation {
  id: string;
  participants: string[];
  participantData: any;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth() as authValue;
  const navigation = useNavigation<NavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos: Conversation[] = [];
      snapshot.forEach((doc) => {
        convos.push({
          id: doc.id,
          ...doc.data()
        } as Conversation);
      });
      // Sort by lastMessageTime in JavaScript instead
      convos.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB.getTime() - timeA.getTime();
      });
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  function handleConversationPress(conversationId: string, otherUserId: string) {
    navigation.navigate("Chat", { conversationId, otherUserId });
  }

  if (loading) return <Loader />;

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, typographyStyles.bold]}>Messages</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-outline" size={80} color="#555" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation with someone</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherUserId = item.participants.find(id => id !== user?.uid);
            const otherUser = item.participantData?.[otherUserId || ""];
            
            return (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => handleConversationPress(item.id, otherUserId || "")}
              >
                <Image
                  source={{ 
                    uri: otherUser?.photoUrl || "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png" 
                  }}
                  style={styles.avatar}
                />
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={[styles.username, typographyStyles.bold]}>
                      {otherUser?.username || "User"}
                    </Text>
                    <Text style={styles.timestamp}>
                      {item.lastMessageTime?.toDate?.().toLocaleDateString() || ""}
                    </Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || "No messages"}
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerTitle: {
    color: "white",
    fontSize: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    color: "white",
    fontSize: 20,
    marginTop: 20,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  username: {
    color: "white",
    fontSize: 16,
  },
  timestamp: {
    color: "#888",
    fontSize: 12,
  },
  lastMessage: {
    color: "#888",
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: "#0095f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
