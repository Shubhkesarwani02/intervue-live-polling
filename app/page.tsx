"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string>("")

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <CardHeader className="text-center pb-6 pt-8 px-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to the Live Polling System
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg leading-relaxed">
            Choose your role to get started with creating and answering questions
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="space-y-4 mb-8">
            <div className="flex items-start space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all duration-200">
              <RadioGroupItem value="student" id="student" className="mt-1 border-2 border-purple-400" />
              <div className="flex-1">
                <Label htmlFor="student" className="text-xl font-semibold cursor-pointer text-gray-900 mb-2 block">
                  I'm a Student
                </Label>
                <p className="text-gray-600 leading-relaxed">
                  Join live polling sessions, answer questions, and view results in real-time
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all duration-200">
              <RadioGroupItem value="teacher" id="teacher" className="mt-1 border-2 border-purple-400" />
              <div className="flex-1">
                <Label htmlFor="teacher" className="text-xl font-semibold cursor-pointer text-gray-900 mb-2 block">
                  I'm a Teacher
                </Label>
                <p className="text-gray-600 leading-relaxed">
                  Create interactive polls, view live results, and manage students in real-time
                </p>
              </div>
            </div>
          </RadioGroup>
          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedRole}
            onClick={() => {
              if (selectedRole === "student") {
                window.location.href = "/student"
              } else {
                window.location.href = "/teacher"
              }
            }}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
