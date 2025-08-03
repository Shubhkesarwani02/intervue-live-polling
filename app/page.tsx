"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [showRoleSelection, setShowRoleSelection] = useState(true)

  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to the Live Polling System</CardTitle>
            <CardDescription>Choose your role to get started with creating and answering questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="student" id="student" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="student" className="font-semibold cursor-pointer">
                      I'm a Student
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Join live polling sessions, answer questions, and view results in real-time
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="teacher" id="teacher" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="teacher" className="font-semibold cursor-pointer">
                      I'm a Teacher
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Create interactive polls, view live results, and manage students in real-time
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
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

  return null
}
