import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  portfolioId?: string;
  taskId?: string;
  data?: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const isConnectedRef = useRef(false);
  
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
      portfolioId
    });
  }, [sendMessage]);

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
    reconnect: connect,
  };
}