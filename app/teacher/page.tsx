"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, History, MessageCircle, Wifi, WifiOff, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { usePoll } from "@/hooks/usePoll"

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
}

interface PollResult {
  option: string
  votes: number
  percentage: number
}

interface PollHistory {
  question: Question
  results: PollResult[]
}

export default function TeacherPage() {
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [timeLimit, setTimeLimit] = useState(60)
  const [showHistory, setShowHistory] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [historyUpdateIndicator, setHistoryUpdateIndicator] = useState(false)

  const { pollStatus, isLoading, error, startPoll, endPoll, kickStudent, joinAsTeacher } = usePoll()

  const { currentQuestion: activeQuestion, students, results: pollResults, pollHistory } = pollStatus
  const isPolling = !!activeQuestion

  // Show indicator when poll history is updated
  useEffect(() => {
    if (pollHistory.length > 0) {
      setHistoryUpdateIndicator(true)
      const timer = setTimeout(() => setHistoryUpdateIndicator(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [pollHistory.length])

  // Join as teacher when component mounts
  useEffect(() => {
    joinAsTeacher()
  }, [joinAsTeacher])

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleAskQuestion = useCallback(async () => {
    if (currentQuestion && options.every((opt) => opt.trim())) {
      const filteredOptions = options.filter((opt) => opt.trim())
      
      const success = startPoll(currentQuestion, filteredOptions, timeLimit)
      
      if (success) {
        console.log("Asked question:", { currentQuestion, options: filteredOptions, timeLimit })
        
        // Reset form
        setCurrentQuestion("")
        setOptions(["", ""])
        setTimeLimit(60)
      }
    }
  }, [currentQuestion, options, timeLimit, startPoll])

  const kickOutStudent = useCallback(
    (studentId: string) => {
      const success = kickStudent(studentId)
      if (success) {
        console.log("Kicked out student:", studentId)
      }
    },
    [kickStudent],
  )

  const resetPoll = useCallback(() => {
    endPoll()
  }, [endPoll])

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

  if (showHistory) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <ConnectionStatus />
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">View Poll History</h1>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Back to Dashboard
            </Button>
          </div>

          <div className="space-y-6">
            {pollHistory.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No poll history available yet.</p>
                </CardContent>
              </Card>
            ) : (
              pollHistory.map((poll, pollIndex) => (
                <Card key={pollIndex}>
                  <CardHeader>
                    <CardTitle className="text-lg">Question {pollIndex + 1}</CardTitle>
                    <div className="bg-gray-800 text-white p-3 rounded">{poll.question.question}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {poll.results.map((result, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                              </div>
                              <span className="font-medium">{result.option}</span>
                            </div>
                            <span className="font-bold">{result.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-purple-600 h-3 rounded-full"
                              style={{ width: `${result.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 p-4">
      <ConnectionStatus />
      {error && (
        <div className="fixed top-16 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          {error}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(true)} 
              className={`bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20 transition-all duration-300 ${
                historyUpdateIndicator ? 'ring-2 ring-yellow-400 animate-pulse' : ''
              }`}
            >
              <History className="w-4 h-4 mr-2" />
              View Poll History
              {historyUpdateIndicator && (
                <Badge variant="secondary" className="ml-2 bg-yellow-400 text-black text-xs">
                  New
                </Badge>
              )}
            </Button>
            <Dialog open={showChat} onOpenChange={setShowChat}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 backdrop-blur border-white/20 text-white hover:bg-white/20">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Chat with Students</DialogTitle>
                </DialogHeader>
                <div className="h-64 bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-center">Chat feature coming soon...</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Question Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">Question</CardTitle>
                  {isPolling && (
                    <Badge variant="secondary" className="animate-pulse bg-green-500 text-white">
                      Live Poll Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {activeQuestion ? (
                  <div>
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-xl mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xl">{activeQuestion.question}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                            {students.filter(s => s.hasAnswered).length}/{students.length} answered
                          </div>
                        </div>
                      </div>
                    </div>

                    {pollResults.length > 0 ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">Live Results</h4>
                          <Badge variant="secondary" className="animate-pulse bg-blue-500 text-white">
                            Updating Live
                          </Badge>
                        </div>
                        {pollResults.map((result, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                  <span className="text-white text-sm font-bold">
                                    {String.fromCharCode(65 + index)}
                                  </span>
                                </div>
                                <span className="font-medium text-lg">{result.option}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500">{result.votes} votes</span>
                                <span className="font-bold text-xl">{result.percentage}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-1000"
                                style={{ width: `${result.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 border-2 border-gray-200 rounded-xl">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white text-sm font-bold">{String.fromCharCode(65 + index)}</span>
                            </div>
                            <span className="text-lg">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-3 mt-8">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={resetPoll}
                        disabled={isLoading}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ask a new question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="new-question" className="text-lg font-semibold text-gray-900 mb-3 block">Enter your question</Label>
                      <Textarea
                        id="new-question"
                        value={currentQuestion}
                        onChange={(e) => setCurrentQuestion(e.target.value)}
                        placeholder="Which planet is known as the Red Planet?"
                        className="text-lg p-4 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label className="text-lg font-semibold text-gray-900 mb-4 block">Poll Options</Label>
                      <div className="space-y-3">
                        {options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white text-sm font-bold">{String.fromCharCode(65 + index)}</span>
                            </div>
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 text-lg p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                            />
                            {options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button variant="ghost" onClick={addOption} className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl py-3">
                          <Plus className="w-4 h-4 mr-2" />
                          Add New option
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="time-limit" className="text-lg font-semibold text-gray-900 mb-3 block">Time Limit (seconds)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Math.max(10, Math.min(60, Number.parseInt(e.target.value) || 60)))}
                        min="10"
                        max="60"
                        className="text-lg p-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                      <p className="text-sm text-gray-500 mt-2">Maximum 60 seconds allowed</p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      onClick={handleAskQuestion}
                      disabled={!currentQuestion || !options.every((opt) => opt.trim()) || isLoading || isPolling}
                    >
                      {isPolling ? "Poll Active - Wait for completion" : "Ask Question"}
                    </Button>
                    {isPolling && (
                      <p className="text-sm text-orange-600 mt-3 text-center bg-orange-50 p-3 rounded-xl">
                        Wait for all students to answer or poll to end before asking a new question
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Participants Panel */}
          <div>
            <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3 text-xl font-bold">
                    <Users className="w-6 h-6" />
                    <span>Participants</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-white/20 text-white font-semibold">{students.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {students.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-lg">No students connected yet</p>
                  ) : (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-300 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-lg text-gray-900">{student.name}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                student.hasAnswered ? "bg-green-500" : "bg-yellow-500"
                              }`}
                            />
                            <p className="text-sm text-gray-600">
                              {student.hasAnswered ? `Answered: ${student.answer}` : "Waiting..."}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => kickOutStudent(student.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-sm rounded-lg"
                          disabled={isLoading}
                        >
                          Kick out
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
