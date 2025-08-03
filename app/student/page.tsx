"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wifi, WifiOff } from "lucide-react"
import { usePoll } from "@/hooks/usePoll"

interface Question {
  id: string
  question: string
  options: string[]
  timeLimit: number
  timeLeft?: number
}

interface PollResult {
  option: string
  votes: number
  percentage: number
}

export default function StudentPage() {
  const [studentName, setStudentName] = useState("")
  const [isNameSet, setIsNameSet] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isKickedOut, setIsKickedOut] = useState(false)
  const [isWaiting, setIsWaiting] = useState(true)
  
  const { pollStatus, isLoading, submitAnswer, joinAsStudent } = usePoll()
  const { currentQuestion, results: pollResults } = pollStatus

  // Check if student has answered
  useEffect(() => {
    if (currentQuestion && isNameSet) {
      const student = pollStatus.students.find(s => s.name === studentName)
      setHasAnswered(student?.hasAnswered || false)
    }
  }, [pollStatus.students, studentName, currentQuestion, isNameSet])

  // Timer countdown
  useEffect(() => {
    if (currentQuestion) {
      const startTime = currentQuestion.startTime
      const timeLimit = currentQuestion.timeLimit * 1000 // Convert to milliseconds
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(Math.ceil(remaining / 1000))
      
      if (remaining > 0 && !hasAnswered) {
        const timer = setInterval(() => {
          const newElapsed = Date.now() - startTime
          const newRemaining = Math.max(0, timeLimit - newElapsed)
          setTimeLeft(Math.ceil(newRemaining / 1000))
          
          if (newRemaining <= 0) {
            clearInterval(timer)
          }
        }, 1000)
        
        return () => clearInterval(timer)
      }
    }
  }, [currentQuestion, hasAnswered])

  // Update waiting state
  useEffect(() => {
    setIsWaiting(!currentQuestion && !pollResults.length)
  }, [currentQuestion, pollResults])

  const handleNameSubmit = useCallback(async () => {
    if (studentName.trim()) {
      const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const success = await joinAsStudent(studentId, studentName.trim())
      if (success) {
        setIsNameSet(true)
        console.log("Joined as student:", studentName.trim())
      }
    }
  }, [studentName, joinAsStudent])

  const handleAnswerSubmit = useCallback(async () => {
    if (selectedAnswer && currentQuestion && studentName) {
      const studentId = `student_${studentName.replace(/\s+/g, '_')}`
      const success = await submitAnswer(studentId, studentName, selectedAnswer)
      if (success) {
        console.log("Submitted answer:", selectedAnswer)
        setHasAnswered(true)
      }
    }
  }, [selectedAnswer, currentQuestion, studentName, submitAnswer])

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
          isLoading ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
        }`}
      >
        {isLoading ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        <span>{isLoading ? "Loading..." : "Connected"}</span>
      </div>
    </div>
  )

  if (isKickedOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-600 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-bold mb-2">You've been Kicked out!</h2>
            <p className="text-gray-600 mb-4">
              Looks like the teacher has removed you from the poll session. Please try again tomorrow.
            </p>
            <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <CardTitle className="text-2xl font-bold">Let's Get Started</CardTitle>
            <CardDescription>
              If you're a student, use this tool to submit your answers, participate in live polls, and view results in
              real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Enter your Name</Label>
              <Input
                id="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Rahul Raju"
                className="mt-1"
                onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
              />
            </div>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleNameSubmit}
              disabled={!studentName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isWaiting || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-bold mb-2">Wait for the teacher to ask questions..</h2>
            <p className="text-gray-500 text-sm">Connected as: {studentName}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAnswered || timeLeft === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <ConnectionStatus />
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Question 1</h1>
                <Badge variant="destructive" className="text-xs">
                  00:00
                </Badge>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="bg-gray-800 text-white">
              <CardTitle className="text-lg">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pollResults.length > 0 ? (
                <div className="space-y-4">
                  {pollResults.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedAnswer === result.option ? "bg-purple-600" : "bg-gray-400"
                            }`}
                          >
                            <span className="text-white text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                          </div>
                          <span className="font-medium">{result.option}</span>
                          {selectedAnswer === result.option && (
                            <Badge variant="secondary" className="text-xs">
                              Your answer
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold">{result.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                  <p className="text-gray-600">Calculating results...</p>
                </div>
              )}
              <div className="mt-6 text-center">
                <p className="text-gray-600">Wait for the teacher to ask a new question.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <ConnectionStatus />
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Question 1</h1>
              <Badge variant="destructive" className="text-xs">
                00:{timeLeft.toString().padStart(2, "0")}
              </Badge>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-gray-800 text-white">
            <CardTitle className="text-lg">{currentQuestion?.question}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQuestion?.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option} id={option} />
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                    </div>
                    <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button
              className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer || isLoading}
            >
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
