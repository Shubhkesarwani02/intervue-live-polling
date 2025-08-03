"use client"

import { useEffect, useState, useCallback } from "react"

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

  const fetchPollStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/poll?action=poll-status")
      if (response.ok) {
        const data = await response.json()
        setPollStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch poll status:", error)
    }
  }, [])

  const startPoll = useCallback(async (question: string, options: string[], timeLimit: number) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start-poll",
          question,
          options,
          timeLimit,
        }),
      })
      
      if (response.ok) {
        await fetchPollStatus()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to start poll:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchPollStatus])

  const endPoll = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end-poll" }),
      })
      
      if (response.ok) {
        await fetchPollStatus()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to end poll:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [fetchPollStatus])

  const submitAnswer = useCallback(async (studentId: string, studentName: string, answer: string) => {
    try {
      const response = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-answer",
          studentId,
          studentName,
          answer,
        }),
      })
      
      if (response.ok) {
        await fetchPollStatus()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to submit answer:", error)
      return false
    }
  }, [fetchPollStatus])

  const joinAsStudent = useCallback(async (studentId: string, studentName: string) => {
    try {
      const response = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join-as-student",
          studentId,
          studentName,
        }),
      })
      
      if (response.ok) {
        await fetchPollStatus()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to join as student:", error)
      return false
    }
  }, [fetchPollStatus])

  const kickStudent = useCallback(async (studentId: string) => {
    try {
      const response = await fetch("/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "kick-student",
          studentId,
        }),
      })
      
      if (response.ok) {
        await fetchPollStatus()
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to kick student:", error)
      return false
    }
  }, [fetchPollStatus])

  // Poll for updates every 2 seconds when there's an active question
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (pollStatus.currentQuestion) {
      interval = setInterval(fetchPollStatus, 2000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [pollStatus.currentQuestion, fetchPollStatus])

  // Initial fetch
  useEffect(() => {
    fetchPollStatus()
  }, [fetchPollStatus])

  return {
    pollStatus,
    isLoading,
    startPoll,
    endPoll,
    submitAnswer,
    joinAsStudent,
    kickStudent,
    refreshStatus: fetchPollStatus,
  }
}
