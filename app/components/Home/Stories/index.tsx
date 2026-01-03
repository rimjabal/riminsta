import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Story from './Story'
import useAuth, { authValue } from '../../../hooks/useAuth'
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../../../lib/firebase'

interface StoryData {
  id: string;
  name: string;
  image: string;
  userId: string;
  createdAt: Timestamp;
}

type props = {}
export default function Stories({}: props) {
  const { user } = useAuth() as authValue;
  const [stories, setStories] = useState<StoryData[]>([]);
  
  useEffect(() => {
    if (!user?.uid) return;

    // Fetch stories from last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const storiesRef = collection(db, 'stories');
    const q = query(
      storiesRef,
      where('createdAt', '>', Timestamp.fromDate(twentyFourHoursAgo))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StoryData));

      setStories(fetchedStories);
    });

    return () => unsubscribe();
  }, [user]);

  const storiesWithUser = React.useMemo(() => {
    const userStory = {
      id: "-1",
      name: "Your Story",
      image: user?.photoURL || "https://w7.pngwing.com/pngs/256/355/png-transparent-computer-icons-female-jewelry-head-silhouette-avatar.png",
      userId: user?.uid || "",
      createdAt: Timestamp.now()
    };
    
    return [userStory, ...stories];
  }, [user, stories]);

  return (
    <View style={styles.container}>
    <FlatList
      horizontal
      data={storiesWithUser}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => <Story {...item} />}
    />
  </View>
 )
}
 
const styles = StyleSheet.create({
    container:{
    marginTop: 0, 
    paddingHorizontal: 10,
    marginBottom:2
}
})