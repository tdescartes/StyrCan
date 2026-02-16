/**
 * WebSocket provider component for real-time notifications
 */

"use client"

import { createContext, useContext, useEffect, ReactNode } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { useAuthStore } from "@/stores/auth-store"

interface WebSocketContextType {
  isConnected: boolean
  sendMessage: (message: any) => void
  connectionAttempts: number
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  connectionAttempts: 0,
})

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { isAuthenticated } = useAuthStore()

  const { isConnected, sendMessage, connectionAttempts } = useWebSocket({
    onConnect: () => {
      console.log("✅ Real-time notifications connected")
    },
    onDisconnect: () => {
      console.log("❌ Real-time notifications disconnected")
    },
    onMessage: (message) => {
      // Additional message handling can be added here
      console.log("📨 WebSocket message:", message)
    },
    reconnect: true,
    reconnectInterval: 5000,
  })

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        connectionAttempts,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
