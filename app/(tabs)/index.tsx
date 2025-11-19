import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
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
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

    const newTodo = await createTodo(trimmed, selectedDate.toISOString());
    setTodos((current) => [newTodo, ...current]);
    setNewTodoTitle('');
    setIsModalVisible(false);
  }, [newTodoTitle, selectedDate]);

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

async function createTodo(title: string, dueDateIso: string): Promise<Todo> {
  // Esta funcao vai inserir a nova tarefa no sqlite futuramente; por enquanto devolve mock
  return {
    id: Date.now(),
    title,
    completed: false,
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
