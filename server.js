const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for demo (use database in production)
let currentQuestion = null
const students = new Map()
const answers = new Map()
const pollHistory = []

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Helper function to calculate results
  const calculateResults = () => {
    if (!currentQuestion) return []

    const results = currentQuestion.options.map((option) => ({
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

  // Helper function to broadcast student list to teachers
  const broadcastStudentList = () => {
    const studentList = Array.from(students.values())
    io.to("teachers").emit("students-updated", studentList)
  }

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Teacher joins
    socket.on("join-as-teacher", () => {
      socket.join("teachers")
      console.log("Teacher joined:", socket.id)

      // Send current state to teacher
      socket.emit("current-question", currentQuestion)
      socket.emit("students-updated", Array.from(students.values()))

      if (currentQuestion) {
        const results = calculateResults()
        socket.emit("poll-results", results)
      }
    })

    // Student joins
    socket.on("join-as-student", (studentName) => {
      socket.join("students")

      const student = {
        id: socket.id,
        name: studentName,
        hasAnswered: currentQuestion ? answers.has(socket.id) : false,
      }

      students.set(socket.id, student)
      socket.data.studentName = studentName

      console.log("Student joined:", studentName)

      // Send current question to student if exists
      if (currentQuestion) {
        const timeLeft = Math.max(
          0,
          currentQuestion.timeLimit - Math.floor((Date.now() - currentQuestion.startTime) / 1000),
        )
        socket.emit("new-question", { ...currentQuestion, timeLeft })

        // If student already answered, send results
        if (answers.has(socket.id)) {
          const results = calculateResults()
          socket.emit("poll-results", results)
        }
      }

      broadcastStudentList()
    })

    // Teacher asks a new question
    socket.on("ask-question", (questionData) => {
      currentQuestion = {
        ...questionData,
        id: Date.now().toString(),
        startTime: Date.now(),
      }

      // Store the question ID for the timer check
      const questionId = currentQuestion.id

      // Clear previous answers
      answers.clear()

      // Reset student answered status
      students.forEach((student) => {
        student.hasAnswered = false
      })

      console.log("New question asked:", currentQuestion.question)

      // Send question to all students
      io.to("students").emit("new-question", currentQuestion)

      // Update teachers with new question
      io.to("teachers").emit("question-started", currentQuestion)
      broadcastStudentList()

      // Set timer for automatic results
      setTimeout(() => {
        if (currentQuestion?.id === questionId) {
          const results = calculateResults()

          // Add to history
          pollHistory.push({
            question: currentQuestion,
            results,
          })

          // Send results to everyone
          io.emit("poll-results", results)
          io.to("teachers").emit("poll-ended", results)

          console.log("Poll ended automatically")
        }
      }, questionData.timeLimit * 1000)
    })

    // Student submits answer
    socket.on("submit-answer", (answerData) => {
      if (!currentQuestion) return

      const student = students.get(socket.id)
      if (!student || student.hasAnswered) return

      // Record answer
      answers.set(socket.id, answerData.answer)
      student.hasAnswered = true
      student.answer = answerData.answer

      console.log(`Student ${student.name} answered: ${answerData.answer}`)

      // Calculate and broadcast updated results
      const results = calculateResults()

      // Send results to the student who just answered
      socket.emit("poll-results", results)

      // Update teachers with new answer
      io.to("teachers").emit("student-answered", {
        studentId: socket.id,
        studentName: student.name,
        answer: answerData.answer,
        results,
      })

      broadcastStudentList()

      // Check if all students have answered
      const allAnswered = Array.from(students.values()).every((s) => s.hasAnswered)
      if (allAnswered && currentQuestion) {
        // Add to history
        pollHistory.push({
          question: currentQuestion,
          results,
        })

        // End poll early
        io.emit("poll-results", results)
        io.to("teachers").emit("poll-ended", results)
        console.log("All students answered - poll ended early")
      }
    })

    // Teacher kicks out student
    socket.on("kick-student", (studentId) => {
      const student = students.get(studentId)
      if (student) {
        console.log(`Kicking out student: ${student.name}`)

        // Remove student data
        students.delete(studentId)
        answers.delete(studentId)

        // Notify the student they've been kicked
        io.to(studentId).emit("kicked-out")

        // Update teachers
        broadcastStudentList()

        // Recalculate results if there's an active poll
        if (currentQuestion) {
          const results = calculateResults()
          io.to("teachers").emit("poll-results-updated", results)
        }
      }
    })

    // Get poll history
    socket.on("get-poll-history", () => {
      socket.emit("poll-history", pollHistory)
    })

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)

      const student = students.get(socket.id)
      if (student) {
        console.log(`Student ${student.name} left`)
        students.delete(socket.id)
        answers.delete(socket.id)
        broadcastStudentList()

        // Recalculate results if there's an active poll
        if (currentQuestion) {
          const results = calculateResults()
          io.to("teachers").emit("poll-results-updated", results)
        }
      }
    })

    // Heartbeat to keep connection alive
    socket.on("ping", () => {
      socket.emit("pong")
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
