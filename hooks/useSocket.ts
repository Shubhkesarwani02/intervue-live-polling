"use client"

import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

interface UseSocketOptions {
  autoConnect?: boolean
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = () => {
    if (socketRef.current?.connected) return socketRef.current

    setIsConnecting(true)

    // Use environment variable for WebSocket URL
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://localhost:3001"
    
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
    })

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
      setIsConnected(true)
      setIsConnecting(false)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
      setIsConnected(false)
      setIsConnecting(false)
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setIsConnecting(false)
    })

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socket.connected) {
        socket.emit("ping")
      }
    }, 30000)

    socket.on("disconnect", () => {
      clearInterval(heartbeat)
    })

    socketRef.current = socket
    return socket
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect])

  return {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connect,
    disconnect,
  }
}
