"use client"

import { useEffect, useState, useCallback } from "react"
import { useSocket } from "./useSocket"

interface Student {
  id: string
  name: string
  hasAnswered: boolean
  answer?: string
}

interface Question {
  id: string
  question: string
  options: string[]
  timeLimit: number
  startTime: number
  timeLeft?: number
}

interface PollResult {
  option: string
  votes: number
  percentage: number
}

interface PollStatus {
  currentQuestion: Question | null
  students: Student[]
  results: PollResult[]
  pollHistory: Array<{ question: Question; results: PollResult[] }>
}

export function usePoll() {
  const [pollStatus, setPollStatus] = useState<PollStatus>({
    currentQuestion: null,
    students: [],
    results: [],
    pollHistory: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isKickedOut, setIsKickedOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { socket, isConnected, connect } = useSocket()

  // Socket event handlers
  useEffect(() => {
    if (!socket) return

    // Handle new questions from teacher
    socket.on("new-question", (question: Question) => {
      console.log("Received new question:", question)
      setPollStatus(prev => ({
        ...prev,
        currentQuestion: question,
        results: [],
      }))
    })

    // Handle question started (for teachers)
    socket.on("question-started", (question: Question) => {
      console.log("Question started:", question)
      setPollStatus(prev => ({
        ...prev,
        currentQuestion: question,
        results: [],
      }))
    })

    // Handle current question on join
    socket.on("current-question", (question: Question | null) => {
      console.log("Current question:", question)
      setPollStatus(prev => ({
        ...prev,
        currentQuestion: question,
      }))
    })

    // Handle students list updates
    socket.on("students-updated", (students: Student[]) => {
      console.log("Students updated:", students)
      setPollStatus(prev => ({
        ...prev,
        students,
      }))
    })

    // Handle poll results
    socket.on("poll-results", (results: PollResult[]) => {
      console.log("Poll results:", results)
      setPollStatus(prev => ({
        ...prev,
        results,
      }))
    })

    // Handle poll results updates (for teachers)
    socket.on("poll-results-updated", (results: PollResult[]) => {
      console.log("Poll results updated:", results)
      setPollStatus(prev => ({
        ...prev,
        results,
      }))
    })

    // Handle student answered (for teachers)
    socket.on("student-answered", ({ studentId, studentName, answer, results }: {
      studentId: string;
      studentName: string;
      answer: string;
      results: PollResult[];
    }) => {
      console.log("Student answered:", { studentId, studentName, answer })
      setPollStatus(prev => ({
        ...prev,
        results,
        students: prev.students.map(s => 
          s.id === studentId ? { ...s, hasAnswered: true, answer } : s
        ),
      }))
    })

    // Handle poll ended
    socket.on("poll-ended", (results: PollResult[]) => {
      console.log("Poll ended:", results)
      setPollStatus(prev => ({
        ...prev,
        currentQuestion: null,
        results,
      }))
    })

    // Handle being kicked out
    socket.on("kicked-out", () => {
      console.log("Kicked out by teacher")
      setIsKickedOut(true)
    })

    // Handle poll history
    socket.on("poll-history", (history: Array<{ question: Question; results: PollResult[] }>) => {
      console.log("Poll history:", history)
      setPollStatus(prev => ({
        ...prev,
        pollHistory: history,
      }))
    })

    // Handle errors
    socket.on("error", (errorData: { message: string }) => {
      console.log("Error from server:", errorData.message)
      setError(errorData.message)
      setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
    })

    return () => {
      socket.off("new-question")
      socket.off("question-started")
      socket.off("current-question")
      socket.off("students-updated")
      socket.off("poll-results")
      socket.off("poll-results-updated")
      socket.off("student-answered")
      socket.off("poll-ended")
      socket.off("kicked-out")
      socket.off("poll-history")
      socket.off("error")
    }
  }, [socket])

  // Join as teacher
  const joinAsTeacher = useCallback(() => {
    if (socket) {
      console.log("Joining as teacher")
      socket.emit("join-as-teacher")
      // Get poll history
      socket.emit("get-poll-history")
    }
  }, [socket])

  // Join as student
  const joinAsStudent = useCallback((studentId: string, studentName: string) => {
    if (socket) {
      console.log("Joining as student:", studentName)
      socket.emit("join-as-student", studentName)
      return true
    }
    return false
  }, [socket])

  // Start a poll (teacher only)
  const startPoll = useCallback((question: string, options: string[], timeLimit: number) => {
    if (socket) {
      console.log("Starting poll:", { question, options, timeLimit })
      socket.emit("ask-question", { question, options, timeLimit })
      return true
    }
    return false
  }, [socket])

  // Submit answer (student only)
  const submitAnswer = useCallback((studentId: string, studentName: string, answer: string) => {
    if (socket) {
      console.log("Submitting answer:", answer)
      socket.emit("submit-answer", { answer })
      return true
    }
    return false
  }, [socket])

  // Kick student (teacher only)
  const kickStudent = useCallback((studentId: string) => {
    if (socket) {
      console.log("Kicking student:", studentId)
      socket.emit("kick-student", studentId)
      return true
    }
    return false
  }, [socket])

  // End poll (teacher only)
  const endPoll = useCallback(() => {
    if (socket) {
      console.log("Ending current poll")
      socket.emit("end-poll")
      return true
    }
    return false
  }, [socket])

  // Refresh status (for compatibility, not needed with socket implementation)
  const refreshStatus = useCallback(() => {
    if (socket) {
      socket.emit("get-poll-history")
    }
  }, [socket])

  return {
    pollStatus,
    isLoading: !isConnected,
    isKickedOut,
    error,
    startPoll,
    endPoll,
    submitAnswer,
    joinAsStudent,
    joinAsTeacher,
    kickStudent,
    refreshStatus,
  }
}
