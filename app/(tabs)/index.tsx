import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

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
  const [filterCompleted, setFilterCompleted] = useState(false);

  const loadTodos = useCallback(async () => {
    const persistedTodos = await fetchTodos();
    setTodos(persistedTodos);
  }, []);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleComplete = useCallback(
    async (todoId: number) => {
      await markTodoAsDone(todoId);
      setTodos((current) => current.map((todo) => (todo.id === todoId ? { ...todo, completed: true } : todo)));
    },
    []
  );

  const handleDelete = useCallback(
    async (todoId: number) => {
      await deleteTodo(todoId);
      setTodos((current) => current.filter((todo) => todo.id !== todoId));
    },
    []
  );

  const renderRightActions = useCallback(
    (item: Todo) => (
      <Pressable style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <ThemedText style={styles.deleteButtonText}>Excluir</ThemedText>
      </Pressable>
    ),
    [handleDelete]
  );

  const renderItem = useCallback(({ item }: { item: Todo }) => {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <ThemedView style={styles.todoCard}>
          <View style={styles.todoInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.todoSubtitle}>
              {item.completed ? 'Status: Concluida' : 'Status: Pendente'}
            </ThemedText>
          </View>
          {!item.completed && (
            <Pressable style={styles.completeButton} onPress={() => handleComplete(item.id)}>
              <ThemedText style={styles.completeButtonText}>Concluir</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </Swipeable>
    );
  }, [handleComplete, renderRightActions]);

  const emptyText = useMemo(() => 'Nenhuma tarefa encontrada.', []);

  const filteredTodos = useMemo(
    () => todos.filter((todo) => (filterCompleted ? todo.completed : !todo.completed)),
    [todos, filterCompleted]
  );

  const handleToggleFilter = useCallback(() => {
    setFilterCompleted((current) => !current);
  }, []);

  const filterLabel = useMemo(
    () => (filterCompleted ? 'Ver pendentes' : 'Ver concluidas'),
    [filterCompleted]
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.screenTitle}>
            Suas tarefas
          </ThemedText>
          <Pressable style={styles.filterButton} onPress={handleToggleFilter}>
            <ThemedText style={styles.filterButtonText}>{filterLabel}</ThemedText>
          </Pressable>
        </View>
        <FlatList
          data={filteredTodos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<ThemedText style={styles.emptyText}>{emptyText}</ThemedText>}
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
}

async function fetchTodos(): Promise<Todo[]> {
  // Placeholder para puxar os dados do sqlite mais na frente
  return MOCK_TODOS;
}

async function markTodoAsDone(_id: number): Promise<void> {
  // Esta funcao vai persistir o status concluido assim que a camada de dados estiver pronta
}

async function deleteTodo(_id: number): Promise<void> {
  // Esta funcao vai remover a tarefa do banco no passo de persistencia
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    marginBottom: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 12,
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  todoInfo: {
    flex: 1,
    marginRight: 12,
  },
  todoSubtitle: {
    marginTop: 4,
    color: '#6c6c6c',
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#34a853',
  },
  completeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    marginVertical: 4,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6c6c6c',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0a7ea4',
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
