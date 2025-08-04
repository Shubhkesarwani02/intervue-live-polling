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
  const [isWaiting, setIsWaiting] = useState(true)
  const [tabId] = useState(() => `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  
  const { pollStatus, isLoading, isKickedOut, submitAnswer, joinAsStudent } = usePoll()
  const { currentQuestion, results: pollResults } = pollStatus

  // Check if student has answered
  useEffect(() => {
    if (currentQuestion && isNameSet) {
      const student = pollStatus.students.find(s => s.name === studentName)
      setHasAnswered(student?.hasAnswered || false)
      setSelectedAnswer(student?.answer || "")
    }
  }, [pollStatus.students, studentName, currentQuestion, isNameSet])

  // Reset student state when poll ends
  useEffect(() => {
    if (!currentQuestion) {
      setHasAnswered(false)
      setSelectedAnswer("")
      setTimeLeft(60)
    }
  }, [currentQuestion])

  // Timer countdown
  useEffect(() => {
    if (currentQuestion && currentQuestion.timeLeft !== undefined) {
      setTimeLeft(Math.min(currentQuestion.timeLeft, 60)) // Ensure max 60 seconds
    } else if (currentQuestion) {
      const startTime = currentQuestion.startTime
      const timeLimit = Math.min(currentQuestion.timeLimit, 60) * 1000 // Ensure max 60 seconds, convert to milliseconds
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(Math.ceil(remaining / 1000))
      
      if (remaining > 0 && !hasAnswered) {
        const timer = setInterval(() => {
          const newElapsed = Date.now() - startTime
          const newRemaining = Math.max(0, timeLimit - newElapsed)
          const newTimeLeft = Math.ceil(newRemaining / 1000)
          setTimeLeft(newTimeLeft)
          
          if (newRemaining <= 0) {
            clearInterval(timer)
            setHasAnswered(true) // Auto-submit when time is up
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

  const handleNameSubmit = useCallback(() => {
    if (studentName.trim()) {
      const uniqueStudentId = `${tabId}_${studentName.replace(/\s+/g, '_')}`
      const success = joinAsStudent(uniqueStudentId, `${studentName.trim()} (${tabId.slice(-4)})`)
      if (success) {
        setIsNameSet(true)
        console.log("Joined as student:", studentName.trim())
      }
    }
  }, [studentName, tabId, joinAsStudent])

  const handleAnswerSubmit = useCallback(() => {
    if (selectedAnswer && currentQuestion && studentName) {
      const uniqueStudentId = `${tabId}_${studentName.replace(/\s+/g, '_')}`
      const success = submitAnswer(uniqueStudentId, `${studentName.trim()} (${tabId.slice(-4)})`, selectedAnswer)
      if (success) {
        console.log("Submitted answer:", selectedAnswer)
        setHasAnswered(true)
      }
    }
  }, [selectedAnswer, currentQuestion, studentName, tabId, submitAnswer])

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm backdrop-blur shadow-lg ${
          isLoading ? "bg-yellow-500/90 text-white" : "bg-green-500/90 text-white"
        }`}
      >
        {isLoading ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        <span className="font-medium">{isLoading ? "Connecting..." : "Connected"}</span>
      </div>
    </div>
  )

  if (isKickedOut) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl text-center">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <span className="text-red-600 text-3xl">!</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">You've been Kicked out!</h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Looks like the teacher has removed you from the poll session. Please try again tomorrow.
            </p>
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <CardHeader className="text-center pb-6 pt-8 px-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-3">Let's Get Started</CardTitle>
            <CardDescription className="text-gray-600 text-lg leading-relaxed">
              If you're a student, use this tool to submit your answers, participate in live polls, and view results in
              real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <div>
              <Label htmlFor="name" className="text-lg font-semibold text-gray-900 mb-3 block">Enter your Name</Label>
              <Input
                id="name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Rahul Raju"
                className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
              />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              onClick={handleNameSubmit}
              disabled={!studentName.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Connecting...
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl text-center">
          <CardContent className="pt-12 pb-12 px-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-purple-600" />
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Wait for the teacher to ask questions..</h2>
            <p className="text-gray-600 text-lg">Connected as: <span className="font-semibold">{studentName}</span></p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAnswered || timeLeft === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 p-4">
        <ConnectionStatus />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Question 1</h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <Badge variant="secondary" className="text-sm bg-green-500 hover:bg-green-600">
                    {timeLeft === 0 ? "Time's Up!" : "Answered"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8">
              <CardTitle className="text-2xl font-bold">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {pollResults.length > 0 ? (
                <div className="space-y-6">
                  {pollResults.map((result, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                              selectedAnswer === result.option 
                                ? "bg-gradient-to-r from-purple-600 to-blue-600" 
                                : "bg-gray-400"
                            }`}
                          >
                            <span className="text-white text-sm font-bold">{String.fromCharCode(65 + index)}</span>
                          </div>
                          <span className="font-medium text-lg text-gray-900">{result.option}</span>
                          {selectedAnswer === result.option && (
                            <Badge variant="secondary" className="text-sm bg-purple-100 text-purple-700">
                              Your answer
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-xl text-gray-900">{result.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-6 text-purple-600" />
                  <p className="text-gray-600 text-lg">Calculating results...</p>
                </div>
              )}
              <div className="mt-8 text-center p-6 bg-gray-50 rounded-xl">
                <p className="text-gray-600 text-lg">Wait for the teacher to ask a new question.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 p-4">
      <ConnectionStatus />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Question 1</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <Badge variant="destructive" className="text-sm bg-red-500 hover:bg-red-600">
                  00:{timeLeft.toString().padStart(2, "0")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-8">
            <CardTitle className="text-2xl font-bold">{currentQuestion?.question}</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-4">
                {currentQuestion?.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all duration-200">
                    <RadioGroupItem value={option} id={option} className="border-2 border-purple-400" />
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">{String.fromCharCode(65 + index)}</span>
                    </div>
                    <Label htmlFor={option} className="flex-1 cursor-pointer font-medium text-lg text-gray-900">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            <Button
              className="w-full mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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
