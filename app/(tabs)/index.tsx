import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

// Lista temporaria para simular dados enquanto a persistencia nao esta pronta
const MOCK_TODOS: Todo[] = [
  { id: 1, title: 'Estudar circuitos eletricos', completed: false },
  { id: 2, title: 'Revisar calculos', completed: true },
  { id: 3, title: 'Preparar relatorio do laboratorio', completed: false },
];

export default function HomeScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const loadTodos = useCallback(async () => {
    const persistedTodos = await fetchTodos();
    setTodos(persistedTodos);
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const renderItem = useCallback(({ item }: { item: Todo }) => {
    return (
      <ThemedView style={styles.todoCard}>
        <View>
          <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
          <ThemedText style={styles.todoSubtitle}>
            {item.completed ? 'Status: Concluida' : 'Status: Pendente'}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.screenTitle}>
        Suas tarefas
      </ThemedText>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

async function fetchTodos(): Promise<Todo[]> {
  // Placeholder para puxar os dados do sqlite mais na frente
  return MOCK_TODOS;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  screenTitle: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  todoCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  todoSubtitle: {
    marginTop: 4,
    color: '#6c6c6c',
  },
});
