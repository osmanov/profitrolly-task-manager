import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface WebSocketMessage {
  type: string;
  portfolioId?: string;
  taskId?: string;
  fieldId?: string;
  value?: any;
  data?: any;
  userId?: string;
  username?: string;
}

interface ActiveField {
  fieldId: string;
  taskId?: string;
  userId: string;
  username: string;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);
  const { user } = useAuth();
  const [activeFields, setActiveFields] = useState<Map<string, ActiveField>>(new Map());
  
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnectedRef.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'portfolio_changed':
            // Invalidate portfolio queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios', message.portfolioId] });
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
            break;
            
          case 'task_changed':
          case 'task_added':
          case 'task_deleted':
            // Invalidate portfolio and task queries
            queryClient.invalidateQueries({ queryKey: ['/api/portfolios', message.portfolioId] });
            queryClient.invalidateQueries({ queryKey: [`/api/portfolios/${message.portfolioId}/tasks`] });
            break;
            
          case 'joined_portfolio':
            console.log('Joined portfolio:', message.portfolioId);
            break;
            
          case 'user_field_focus':
            // Another user focused on a field
            setActiveFields(prev => {
              const newMap = new Map(prev);
              const fieldKey = message.taskId ? `${message.fieldId}-${message.taskId}` : message.fieldId!;
              newMap.set(fieldKey, {
                fieldId: message.fieldId!,
                taskId: message.taskId,
                userId: message.userId!,
                username: message.username!
              });
              return newMap;
            });
            break;
            
          case 'user_field_blur':
            // Another user unfocused from a field
            setActiveFields(prev => {
              const newMap = new Map(prev);
              const fieldKey = message.taskId ? `${message.fieldId}-${message.taskId}` : message.fieldId!;
              newMap.delete(fieldKey);
              return newMap;
            });
            break;
            
          case 'field_changed':
            // Real-time field value changes from another user
            const fieldKey = message.taskId ? `${message.fieldId}-${message.taskId}` : message.fieldId!;
            
            // Update the field in the DOM if it exists and is not currently focused by this user
            const fieldElement = document.querySelector(`[data-field-id="${fieldKey}"]`) as HTMLInputElement | HTMLTextAreaElement;
            if (fieldElement && document.activeElement !== fieldElement) {
              fieldElement.value = message.value || '';
              
              // Trigger a change event to update React form state
              const event = new Event('input', { bubbles: true });
              fieldElement.dispatchEvent(event);
            }
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      isConnectedRef.current = false;
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (!isConnectedRef.current) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      isConnectedRef.current = false;
    }
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const joinPortfolio = useCallback((portfolioId: string) => {
    sendMessage({
      type: 'join_portfolio',
      portfolioId,
      userId: user?.id,
      username: user?.username
    });
  }, [sendMessage, user]);

  const notifyPortfolioUpdate = useCallback((portfolioId: string, data: any) => {
    sendMessage({
      type: 'portfolio_update',
      portfolioId,
      data
    });
  }, [sendMessage]);

  const notifyTaskUpdate = useCallback((portfolioId: string, taskId: string, data: any) => {
    sendMessage({
      type: 'task_update',
      portfolioId,
      taskId,
      data
    });
  }, [sendMessage]);

  const notifyTaskAdded = useCallback((portfolioId: string, task: any) => {
    sendMessage({
      type: 'task_added',
      portfolioId,
      data: task
    });
  }, [sendMessage]);

  const notifyTaskDeleted = useCallback((portfolioId: string, taskId: string) => {
    sendMessage({
      type: 'task_deleted',
      portfolioId,
      taskId
    });
  }, [sendMessage]);

  const notifyFieldFocus = useCallback((portfolioId: string, fieldId: string, taskId?: string) => {
    sendMessage({
      type: 'field_focus',
      portfolioId,
      fieldId,
      taskId
    });
  }, [sendMessage]);

  const notifyFieldBlur = useCallback((portfolioId: string, fieldId: string, taskId?: string) => {
    sendMessage({
      type: 'field_blur',
      portfolioId,
      fieldId,
      taskId
    });
  }, [sendMessage]);

  const notifyFieldChange = useCallback((portfolioId: string, fieldId: string, value: any, taskId?: string) => {
    sendMessage({
      type: 'field_change',
      portfolioId,
      fieldId,
      value,
      taskId
    });
  }, [sendMessage]);

  const getActiveFieldUser = useCallback((fieldId: string, taskId?: string) => {
    const fieldKey = taskId ? `${fieldId}-${taskId}` : fieldId;
    return activeFields.get(fieldKey);
  }, [activeFields]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected: isConnectedRef.current,
    sendMessage,
    joinPortfolio,
    notifyPortfolioUpdate,
    notifyTaskUpdate,
    notifyTaskAdded,
    notifyTaskDeleted,
    notifyFieldFocus,
    notifyFieldBlur,
    notifyFieldChange,
    getActiveFieldUser,
    activeFields,
    reconnect: connect,
  };
}