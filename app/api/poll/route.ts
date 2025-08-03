import { NextRequest, NextResponse } from "next/server"

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

// In-memory storage for demo (use database in production)
let currentQuestion: Question | null = null
const students: Map<string, Student> = new Map()
const answers: Map<string, string> = new Map()
const pollHistory: Array<{ question: Question; results: PollResult[] }> = []

export const dynamic = "force-dynamic"

// Helper function to calculate results
const calculateResults = (): PollResult[] => {
  if (!currentQuestion) return []

  const results: PollResult[] = currentQuestion.options.map((option) => ({
    option,
    votes: 0,
    percentage: 0,
  }))

  const totalAnswers = answers.size
  if (totalAnswers === 0) return results

  // Count votes for each option
  answers.forEach((answer) => {
    const resultIndex = results.findIndex((r) => r.option === answer)
    if (resultIndex !== -1) {
      results[resultIndex].votes++
    }
  })

  // Calculate percentages
  results.forEach((result) => {
    result.percentage = Math.round((result.votes / totalAnswers) * 100)
  })

  return results
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  switch (action) {
    case "poll-status":
      return NextResponse.json({
        currentQuestion,
        students: Array.from(students.values()),
        results: calculateResults(),
        pollHistory,
      })

    case "current-question":
      return NextResponse.json({ currentQuestion })

    case "results":
      return NextResponse.json({ results: calculateResults() })

    case "students":
      return NextResponse.json({ students: Array.from(students.values()) })

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  switch (action) {
    case "start-poll":
      const { question, options, timeLimit } = body
      currentQuestion = {
        id: Date.now().toString(),
        question,
        options,
        timeLimit,
        startTime: Date.now(),
      }
      // Reset previous answers
      answers.clear()
      students.forEach((student) => {
        student.hasAnswered = false
        student.answer = undefined
      })

      return NextResponse.json({ success: true, question: currentQuestion })

    case "end-poll":
      if (currentQuestion) {
        const results = calculateResults()
        pollHistory.push({ question: currentQuestion, results })
        currentQuestion = null
        return NextResponse.json({ success: true, results })
      }
      return NextResponse.json({ error: "No active poll" }, { status: 400 })

    case "submit-answer":
      const { studentId, studentName, answer } = body
      if (!currentQuestion) {
        return NextResponse.json({ error: "No active poll" }, { status: 400 })
      }

      // Add or update student
      students.set(studentId, {
        id: studentId,
        name: studentName,
        hasAnswered: true,
        answer,
      })

      // Record answer
      answers.set(studentId, answer)

      return NextResponse.json({ success: true })

    case "join-as-student":
      const { studentId: joinStudentId, studentName: joinStudentName } = body
      students.set(joinStudentId, {
        id: joinStudentId,
        name: joinStudentName,
        hasAnswered: false,
      })

      return NextResponse.json({ success: true })

    case "kick-student":
      const { studentId: kickStudentId } = body
      students.delete(kickStudentId)
      answers.delete(kickStudentId)
      return NextResponse.json({ success: true })

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
}
