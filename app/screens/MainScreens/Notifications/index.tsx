import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../..";

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  fromUserId: string;
  fromUsername: string;
  fromUserPhoto: string;
  toUserId: string;
  postId?: string;
  postImage?: string;
  commentText?: string;
  createdAt: any;
  read: boolean;
}

export default function Notifications() {
  const { user } = useAuth() as authValue;
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("toUserId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      // Sort by createdAt in JavaScript
      notifs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // The real-time listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.read) {
          const notifRef = doc(db, "notifications", notif.id);
          batch.update(notifRef, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await markAsRead(notification.id);

    if (notification.type === "follow") {
      navigation.navigate("UserProfile", { userId: notification.fromUserId });
    } else if (notification.type === "like" || notification.type === "comment") {
      if (notification.postId) {
        navigation.navigate("Comments", { id: notification.postId });
      }
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return "liked your post.";
      case "comment":
        return notification.commentText 
          ? `commented: ${notification.commentText.substring(0, 30)}${notification.commentText.length > 30 ? '...' : ''}`
          : "commented on your post.";
      case "follow":
        return "started following you.";
      default:
        return "";
    }
  };

  const getTimeAgo = (createdAt: any) => {
    if (!createdAt?.toMillis) return "";
    
    const now = Date.now();
    const diff = now - createdAt.toMillis();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(diff / 604800000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${weeks}w`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <Image
        source={{ uri: item.fromUserPhoto || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.username}>{item.fromUsername}</Text>
          {" "}
          <Text style={styles.actionText}>{getNotificationText(item)}</Text>
        </Text>
        <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
      </View>
      {item.postImage && (
        <Image source={{ uri: item.postImage }} style={styles.postThumbnail} />
      )}
      {item.type === "follow" && (
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      )}
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="bell" size={60} color="#666" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            When someone likes or comments on your posts, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    color: "#0095f6",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationItem: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  unreadNotification: {
    backgroundColor: "#0a0a0a",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    color: "white",
    fontSize: 14,
    marginBottom: 4,
  },
  username: {
    fontWeight: "bold",
  },
  actionText: {
    color: "#ccc",
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
  postThumbnail: {
    width: 44,
    height: 44,
    marginLeft: 8,
  },
  followButton: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  followButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0095f6",
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -4,
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
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
