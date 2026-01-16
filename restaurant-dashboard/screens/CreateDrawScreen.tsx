import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { drawsApi } from '../services/drawsApi';
import { useNavigation } from '@react-navigation/native';

export default function CreateDrawScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'fixed_date' | 'condition'>('fixed_date');
  const [drawDate, setDrawDate] = useState(''); // YYYY-MM-DD HH:mm
  const [triggerValue, setTriggerValue] = useState(''); // Number of participants
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (type === 'fixed_date' && !drawDate) {
      Alert.alert('Error', 'Please enter a draw date');
      return;
    }

    if (type === 'condition' && !triggerValue) {
      Alert.alert('Error', 'Please enter the number of participants required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        title,
        description,
        type,
      };

      if (type === 'fixed_date') {
        // Simple date parsing, assume user enters format correctly or use ISO
        // For better UX, we'd use a date picker
        const date = new Date(drawDate);
        if (isNaN(date.getTime())) {
          Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD HH:mm');
          setLoading(false);
          return;
        }
        payload.draw_date = date.toISOString();
      } else {
        const val = parseInt(triggerValue);
        if (isNaN(val) || val <= 0) {
          Alert.alert('Error', 'Invalid participant count');
          setLoading(false);
          return;
        }
        payload.trigger_value = val;
      }

      await drawsApi.createDraw(payload);
      Alert.alert('Success', 'Draw created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create draw');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Draw Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g., Win a Free Dinner"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Details about the prize..."
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Draw Type</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity 
          style={[styles.typeButton, type === 'fixed_date' && styles.typeButtonActive]}
          onPress={() => setType('fixed_date')}
        >
          <Text style={[styles.typeText, type === 'fixed_date' && styles.typeTextActive]}>Fixed Date</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, type === 'condition' && styles.typeButtonActive]}
          onPress={() => setType('condition')}
        >
          <Text style={[styles.typeText, type === 'condition' && styles.typeTextActive]}>By Participants</Text>
        </TouchableOpacity>
      </View>

      {type === 'fixed_date' ? (
        <>
          <Text style={styles.label}>Draw Date (YYYY-MM-DD HH:mm)</Text>
          <TextInput
            style={styles.input}
            value={drawDate}
            onChangeText={setDrawDate}
            placeholder="2024-12-31 20:00"
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Required Participants</Text>
          <TextInput
            style={styles.input}
            value={triggerValue}
            onChangeText={setTriggerValue}
            placeholder="e.g., 10"
            keyboardType="numeric"
          />
        </>
      )}

      <Button
        title={loading ? "Creating..." : "Create Draw"}
        onPress={handleCreate}
        disabled={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    marginRight: 5,
    borderRadius: 5,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeText: {
    color: '#007AFF',
  },
  typeTextActive: {
    color: '#fff',
  },
});
