import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { drawsApi } from '../lib/api';

export default function DrawDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { id } = route.params;
  
  const [draw, setDraw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const fetchDetails = async () => {
    try {
      const data = await drawsApi.getDrawById(id);
      setDraw(data);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      const result = await drawsApi.joinDraw(id);
      
      // Check if won immediately
      if (result.isWinner) {
        Alert.alert('🎉 WINNER! 🎉', result.message || 'You won this draw!', [
          { text: 'Awesome!', onPress: fetchDetails }
        ]);
      } else {
        Alert.alert('Success', 'You have joined the draw successfully!', [
          { text: 'OK', onPress: fetchDetails }
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to join draw';
      Alert.alert('Error', msg);
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (!draw) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{draw.title}</Text>
        <Text style={[styles.status, { color: draw.status === 'active' ? '#27ae60' : '#7f8c8d' }]}>
          {draw.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.description}>{draw.description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Draw Rules</Text>
        {draw.type === 'fixed_date' ? (
          <Text style={styles.infoText}>
            📅 Opens on: {new Date(draw.draw_date).toLocaleString()}
          </Text>
        ) : (
          <Text style={styles.infoText}>
            👥 Triggers at {draw.trigger_value} participants
          </Text>
        )}
      </View>

      {draw.status === 'completed' && draw.winner_user_id ? (
        <View style={styles.winnerBox}>
          <Text style={styles.winnerText}>🏆 Draw Completed 🏆</Text>
          <Text style={styles.winnerSubtext}>Winner has been selected!</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.joinButton, joining && styles.disabledButton]}
          onPress={handleJoin}
          disabled={joining || draw.status !== 'active'}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>
              {draw.status === 'active' ? 'Participate Now!' : 'Draw Closed'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  description: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 25,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  joinButton: {
    backgroundColor: '#3498db',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  winnerBox: {
    backgroundColor: '#f1c40f20',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1c40f',
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 5,
  },
  winnerSubtext: {
    color: '#7f8c8d',
  },
});
