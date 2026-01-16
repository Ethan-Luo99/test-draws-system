// mobile-app/screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { drawsApi } from '../lib/api';

interface Draw {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  participant_count?: number;
  created_at: string;
}

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDraws = async () => {
    try {
      setLoading(true);
      const data = await drawsApi.getDraws();
      setDraws(data);
    } catch (error: any) {
      console.error('Error fetching draws:', error);
      Alert.alert(
        'Error / Erreur',
        error.message || 'Failed to fetch draws / Échec de la récupération des tirages'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDraws();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderDrawItem = ({ item }: { item: Draw }) => (
    <TouchableOpacity 
      style={styles.drawItem}
      onPress={() => navigation.navigate('DrawDetails', { id: item.id })}
    >
      <Text style={styles.drawTitle}>{item.title}</Text>
      <Text style={styles.drawDescription}>{item.description}</Text>
      <View style={styles.drawMeta}>
        <Text style={styles.drawType}>
          Type: {item.type} / Type: {item.type}
        </Text>
        <Text style={styles.drawStatus}>
          Status: {item.status} / Statut: {item.status}
        </Text>
      </View>
      {item.participant_count !== undefined && (
        <Text style={styles.participantCount}>
          Participants: {item.participant_count} / Participants: {item.participant_count}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        No draws found / Aucun tirage trouvé
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Create your first draw to get started! / Créez votre premier tirage pour commencer !
      </Text>
    </View>
  );

  useEffect(() => {
    fetchDraws();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>
          Loading draws... / Chargement des tirages...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Welcome / Bienvenue
        </Text>
        <Text style={styles.userEmail}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          My Draws / Mes Tirages
        </Text>
        
        <FlatList
          data={draws}
          renderItem={renderDrawItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
            />
          }
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>
            Sign Out / Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  drawItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  drawDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  drawMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  drawType: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  drawStatus: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  participantCount: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    marginTop: 20,
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
