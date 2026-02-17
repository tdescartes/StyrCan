/**
 * WebSocket hook for real-time notifications
 */

"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useToast } from "./use-toast"

interface WebSocketMessage {
    type: string
    notification_type?: string
    title?: string
    message?: string
    data?: any
    timestamp?: string
    status?: string
}

interface UseWebSocketOptions {
    onMessage?: (message: WebSocketMessage) => void
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Event) => void
    reconnect?: boolean
    reconnectInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
    const {
        onMessage,
        onConnect,
        onDisconnect,
        onError,
        reconnect = true,
        reconnectInterval = 5000,
    } = options

    const { toast } = useToast()
    const { isAuthenticated } = useAuthStore()
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionAttempts, setConnectionAttempts] = useState(0)

    const connect = useCallback(() => {
        if (!isAuthenticated) {
            return
        }

        // Don't connect if already connected
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        try {
            // Get token from localStorage
            const token = localStorage.getItem("access_token")
            if (!token) {
                console.error("No access token found for WebSocket connection")
                return
            }

            // Determine WebSocket URL
            const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
            const wsUrl = apiUrl.replace(/^https?:/, wsProtocol)

            // Create WebSocket connection
            const ws = new WebSocket(`${wsUrl}/api/notifications/ws?token=${token}`)

            ws.onopen = () => {
                console.log("WebSocket connected")
                setIsConnected(true)
                setConnectionAttempts(0)
                onConnect?.()
            }

            ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)

                    // Handle connection confirmation
                    if (message.type === "connection" && message.status === "connected") {
                        console.log("WebSocket connection confirmed")
                        return
                    }

                    // Handle pong response
                    if (message.type === "pong") {
                        return
                    }

                    // Handle notifications
                    if (message.type === "notification") {
                        // Show toast notification
                        toast({
                            title: message.title || "Notification",
                            description: message.message,
                        })
                    }

                    // Call custom message handler
                    onMessage?.(message)
                } catch (error) {
                    console.error("Failed to parse WebSocket message:", error)
                }
            }

            ws.onerror = (error) => {
                console.error("WebSocket error:", error)
                onError?.(error)
            }

            ws.onclose = () => {
                console.log("WebSocket disconnected")
                setIsConnected(false)
                onDisconnect?.()

                // Attempt to reconnect if enabled
                if (reconnect && isAuthenticated) {
                    setConnectionAttempts((prev) => prev + 1)
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect()
                    }, reconnectInterval)
                }
            }

            wsRef.current = ws
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error)
        }
    }, [isAuthenticated, reconnect, reconnectInterval, onConnect, onDisconnect, onError, onMessage, toast])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        setIsConnected(false)
    }, [])

    const sendMessage = useCallback((message: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        } else {
            console.warn("WebSocket is not connected. Cannot send message.")
        }
    }, [])

    const ping = useCallback(() => {
        sendMessage({
            type: "ping",
            timestamp: new Date().toISOString(),
        })
    }, [sendMessage])

    // Auto-connect when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            connect()
        } else {
            disconnect()
        }

        return () => {
            disconnect()
        }
    }, [isAuthenticated, connect, disconnect])

    // Ping server every 30 seconds to keep connection alive
    useEffect(() => {
        if (!isConnected) return

        const interval = setInterval(() => {
            ping()
        }, 30000)

        return () => clearInterval(interval)
    }, [isConnected, ping])

    return {
        isConnected,
        connect,
        disconnect,
        sendMessage,
        ping,
        connectionAttempts,
    }
}
