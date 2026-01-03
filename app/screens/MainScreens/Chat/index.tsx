import React, { useEffect, useState, useRef } from "react";
import { View, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from "react-native";
import Screen from "../../../components/Shared/Screen";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { typographyStyles } from "../../../constants";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../..";
import Loader from "../../../components/Shared/Loader";

type Props = StackScreenProps<RootStackParamList, "Chat">;

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export default function Chat({ route, navigation }: Props) {
  const { conversationId, otherUserId } = route.params;
  const { user } = useAuth() as authValue;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchOtherUser();
    loadMessages();
  }, [conversationId]);

  async function fetchOtherUser() {
    try {
      const userDoc = await getDoc(doc(db, "users", otherUserId));
      if (userDoc.exists()) {
        setOtherUser(userDoc.data());
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  function loadMessages() {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(msgs);
      setLoading(false);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return unsubscribe;
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      // Update conversation metadata
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
      });

      setNewMessage("");
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  if (loading) return <Loader />;

  return (
    <Screen>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image
              source={{ 
                uri: otherUser?.photoUrl || "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png" 
              }}
              style={styles.headerAvatar}
            />
            <Text style={[styles.headerTitle, typographyStyles.bold]}>
              {otherUser?.username || "User"}
            </Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => {
            const isMyMessage = item.senderId === user?.uid;
            return (
              <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                  <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.otherMessageText]}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#888"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? "#0095f6" : "#555"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
  },
  messagesContainer: {
    padding: 15,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 8,
  },
  myMessageRow: {
    alignItems: "flex-end",
  },
  otherMessageRow: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: "#0095f6",
  },
  otherMessage: {
    backgroundColor: "#262626",
  },
  messageText: {
    fontSize: 15,
  },
  myMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#333",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#262626",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "white",
    maxHeight: 100,
  },
});
