import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { Entypo, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../../screens";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import useAuth, { authValue } from "../../../hooks/useAuth";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function Header() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth() as authValue;
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const color = "white";
  const size = 24;

  useEffect(() => {
    if (!user?.uid) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("toUserId", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user]);
  return (
    <View style={styles.headerContainer}>
      <Image
        source={require("../../../../assets/insta-logo.png")}
        style={styles.image}
      />
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => navigation.navigate("Main", { screen: "Post" })}>
          <MaterialCommunityIcons name="plus-box" color={color} size={size} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{marginHorizontal:15, position: "relative"}} 
          onPress={() => navigation.navigate("Notifications")}
        >
          <Entypo name="heart-outlined" color={color} size={size} />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.message} onPress={() => navigation.navigate("Messages")}>
          <Feather name="message-circle" color={color} size={size} />
          <View style={styles.messageText}>
            <Text style={{ color: "white", textAlign: "center", fontSize:10 }}>5</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 150,
    height: 100,
    resizeMode: "contain",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 80,
  },
  headerRight: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  message: {
    position: "relative",
  },
  messageText: {
    position: "absolute",
    right: -10,
    top: -8,
    backgroundColor: "#eb4d6d",
    padding: 1.5,
    borderRadius: 10,
    height: 20,
    width: 20,
    alignItems:"center",
    justifyContent:"center"
  },
  notificationBadge: {
    position: "absolute",
    right: -8,
    top: -6,
    backgroundColor: "#eb4d6d",
    padding: 1.5,
    borderRadius: 10,
    minHeight: 18,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    color: "white",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "bold",
  },
});
