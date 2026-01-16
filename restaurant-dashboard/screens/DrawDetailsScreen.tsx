import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { drawsApi } from '../services/drawsApi';

export default function DrawDetailsScreen() {
  const route = useRoute<any>();
  const { id } = route.params;
  
  const [draw, setDraw] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      // Parallel fetch
      const [drawRes, participantsRes] = await Promise.all([
        drawsApi.getDrawById(id),
        drawsApi.getParticipants(id)
      ]);
      
      setDraw(drawRes.data);
      setParticipants(participantsRes.data.participants || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!draw) {
    return (
      <View style={styles.center}>
        <Text>Draw not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{draw.title}</Text>
        <Text style={[styles.status, { color: draw.status === 'active' ? 'green' : 'gray' }]}>
          {draw.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.description}>{draw.description || 'No description'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Draw Conditions</Text>
        <Text style={styles.info}>Type: {draw.type === 'fixed_date' ? 'Fixed Date' : 'Participant Limit'}</Text>
        
        {draw.type === 'fixed_date' && (
          <Text style={styles.info}>Draw Date: {new Date(draw.draw_date).toLocaleString()}</Text>
        )}
        
        {draw.type === 'condition' && (
          <Text style={styles.info}>Target Participants: {draw.trigger_value}</Text>
        )}

        <Text style={styles.info}>Current Participants: {participants.length}</Text>
      </View>

      {draw.status === 'completed' && draw.winner && (
        <View style={[styles.section, styles.winnerSection]}>
          <Text style={styles.sectionTitle}>🏆 Winner 🏆</Text>
          <Text style={styles.winnerText}>
            User ID: {draw.winner.id.substring(0, 8)}...
          </Text>
          {draw.winner.name && <Text style={styles.winnerText}>Name: {draw.winner.name}</Text>}
          {draw.winner.email && <Text style={styles.winnerText}>Email: {draw.winner.email}</Text>}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Participants</Text>
        {participants.length === 0 ? (
          <Text style={styles.emptyText}>No participants yet</Text>
        ) : (
          participants.slice(0, 10).map((p: any) => (
            <View key={p.id} style={styles.participantRow}>
              <Text>User: {p.user_id.substring(0, 8)}...</Text>
              <Text style={styles.date}>{new Date(p.participated_at).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </View>
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
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
  winnerSection: {
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#ffe58f',
  },
  winnerText: {
    fontSize: 16,
    color: '#d48806',
    fontWeight: '500',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  date: {
    color: '#999',
    fontSize: 12,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
});
