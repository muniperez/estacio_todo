import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
};

type TodoRow = {
  id: number;
  title: string;
  completed: number;
  due_date: string | null;
  created_at: string;
};

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const loadTodos = useCallback(async () => {
    // Busca todas as tarefas persistidas e aplica a ordenacao desejada
    const rows = await db.getAllAsync<TodoRow>(
      'SELECT id, title, completed, due_date, created_at FROM todos ORDER BY due_date IS NULL, due_date ASC, created_at DESC'
    );
    setTodos(rows.map(mapRowToTodo));
  }, [db]);

  useEffect(() => {
    void loadTodos();
  }, [loadTodos]);

  const handleComplete = useCallback(
    async (todoId: number) => {
      // Atualiza o status para concluido diretamente no banco
      await db.runAsync('UPDATE todos SET completed = 1 WHERE id = ?', [todoId]);
      await loadTodos();
    },
    [db, loadTodos]
  );

  const handleDelete = useCallback(
    async (todoId: number) => {
      // Remove definitivamente a tarefa do banco
      await db.runAsync('DELETE FROM todos WHERE id = ?', [todoId]);
      await loadTodos();
    },
    [db, loadTodos]
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
    const dueDateLabel = item.dueDate
      ? new Date(item.dueDate).toLocaleDateString('pt-BR')
      : 'Sem prazo definido';

    return (
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <ThemedView style={styles.todoCard}>
          <View style={styles.todoInfo}>
            <ThemedText type="defaultSemiBold" numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.todoSubtitle}>Prazo: {dueDateLabel}</ThemedText>
            <ThemedText style={styles.todoStatus}>
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

  const emptyText = useMemo(
    () => (filterCompleted ? 'Nenhuma tarefa concluida.' : 'Nenhuma tarefa pendente.'),
    [filterCompleted]
  );

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

  const handleOpenModal = useCallback(() => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      Alert.alert('Aviso', 'Digite a descricao da tarefa antes de adicionar.');
      return;
    }
    setSelectedDate(new Date());
    setIsModalVisible(true);
  }, [newTodoTitle]);

  const handleDateChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android' && _event.type === 'dismissed') {
        return;
      }
      if (date) {
        setSelectedDate(date);
      }
    },
    []
  );

  const handleCancelModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const handleConfirmCreate = useCallback(async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      Alert.alert('Aviso', 'Digite a descricao da tarefa antes de adicionar.');
      return;
    }

    // Insere a nova tarefa com o prazo selecionado
    const dueDateIso = selectedDate.toISOString();
    const createdAt = new Date().toISOString();
    await db.runAsync('INSERT INTO todos (title, completed, due_date, created_at) VALUES (?, 0, ?, ?)', [
      trimmed,
      dueDateIso,
      createdAt,
    ]);
    await loadTodos();
    setNewTodoTitle('');
    setIsModalVisible(false);
  }, [db, loadTodos, newTodoTitle, selectedDate]);

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
        <KeyboardAvoidingView
          style={styles.composerContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
          <TextInput
            style={styles.input}
            placeholder="Descreva a nova tarefa"
            placeholderTextColor="#888888"
            value={newTodoTitle}
            onChangeText={setNewTodoTitle}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={handleOpenModal}>
            <ThemedText style={styles.addButtonText}>Adicionar</ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </ThemedView>

      <Modal
        transparent
        animationType="fade"
        visible={isModalVisible}
        onRequestClose={handleCancelModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Escolha a data limite
            </ThemedText>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
              onChange={handleDateChange}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButtonSec} onPress={handleCancelModal}>
                <ThemedText style={styles.modalButtonSecText}>Cancelar</ThemedText>
              </Pressable>
              <Pressable style={styles.modalButton} onPress={handleConfirmCreate}>
                <ThemedText style={styles.modalButtonText}>Salvar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

function mapRowToTodo(row: TodoRow): Todo {
  // Converte o formato cru do banco para o modelo exibido na interface
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
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
  todoStatus: {
    marginTop: 2,
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
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0a7ea4',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  modalTitle: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginLeft: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalButtonSec: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a7ea4',
    alignItems: 'center',
  },
  modalButtonSecText: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
