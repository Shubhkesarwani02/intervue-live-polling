// # Production WebSocket Server
const { createServer } = require('http')
const { Server } = require('socket.io')
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())

const port = process.env.PORT || 3001

// In-memory storage for demo (use database in production)
let currentQuestion = null
const students = new Map()
const answers = new Map()
const pollHistory = []

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
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
  for (const answer of answers.values()) {
    const optionIndex = currentQuestion.options.indexOf(answer)
    if (optionIndex !== -1) {
      results[optionIndex].votes++
    }
  }

  // Calculate percentages
  results.forEach((result) => {
    result.percentage = Math.round((result.votes / totalAnswers) * 100)
  })

  return results
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Teacher joins
  socket.on('teacher-join', () => {
    socket.join('teachers')
    socket.emit('current-question', {
      question: currentQuestion,
      results: calculateResults(),
    })
    console.log('Teacher joined:', socket.id)
  })

  // Student joins
  socket.on('student-join', (data) => {
    const student = {
      id: socket.id,
      name: data.name,
      hasAnswered: false,
    }
    students.set(socket.id, student)
    socket.join('students')

    // Send current question if exists
    if (currentQuestion) {
      const hasAnswered = answers.has(socket.id)
      socket.emit('question-started', {
        ...currentQuestion,
        hasAnswered,
      })
    }

    // Update teacher with new student count
    io.to('teachers').emit('students-update', {
      totalStudents: students.size,
      answeredStudents: answers.size,
    })

    console.log('Student joined:', data.name, socket.id)
  })

  // Teacher starts a new question
  socket.on('start-question', (data) => {
    // Clear previous answers
    answers.clear()
    
    // Reset student answered status
    for (const student of students.values()) {
      student.hasAnswered = false
    }

    currentQuestion = {
      id: Date.now().toString(),
      question: data.question,
      options: data.options,
      timeLimit: data.timeLimit,
      startTime: Date.now(),
    }

    // Broadcast to all students
    io.to('students').emit('question-started', currentQuestion)
    
    // Update teachers
    io.to('teachers').emit('question-started', {
      question: currentQuestion,
      results: calculateResults(),
    })

    console.log('New question started:', currentQuestion.question)

    // Auto-end question after time limit
    setTimeout(() => {
      if (currentQuestion && currentQuestion.id === data.id) {
        endCurrentQuestion()
      }
    }, data.timeLimit * 1000)
  })

  // Student submits answer
  socket.on('submit-answer', (data) => {
    if (!currentQuestion) return

    const student = students.get(socket.id)
    if (!student) return

    // Store answer
    answers.set(socket.id, data.answer)
    student.hasAnswered = true
    student.answer = data.answer

    // Confirm to student
    socket.emit('answer-submitted')

    // Update teachers with new results
    const results = calculateResults()
    io.to('teachers').emit('answer-update', {
      results,
      totalStudents: students.size,
      answeredStudents: answers.size,
    })

    console.log('Answer submitted:', student.name, data.answer)
  })

  // Teacher ends question manually
  socket.on('end-question', () => {
    endCurrentQuestion()
  })

  // Teacher requests current results
  socket.on('get-results', () => {
    if (currentQuestion) {
      socket.emit('results-update', {
        question: currentQuestion,
        results: calculateResults(),
        totalStudents: students.size,
        answeredStudents: answers.size,
      })
    }
  })

  // Get poll history
  socket.on('get-history', () => {
    socket.emit('poll-history', pollHistory)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    const student = students.get(socket.id)
    if (student) {
      students.delete(socket.id)
      answers.delete(socket.id)
      
      // Update teachers
      io.to('teachers').emit('students-update', {
        totalStudents: students.size,
        answeredStudents: answers.size,
      })
      
      console.log('Student disconnected:', student.name, socket.id)
    }
    console.log('User disconnected:', socket.id)
  })
})

// Helper function to end current question
function endCurrentQuestion() {
  if (!currentQuestion) return

  const results = calculateResults()
  
  // Add to history
  pollHistory.push({
    question: { ...currentQuestion },
    results: [...results],
    timestamp: new Date().toISOString(),
  })

  // Broadcast results to everyone
  io.emit('question-ended', {
    question: currentQuestion,
    results,
  })

  console.log('Question ended:', currentQuestion.question)
  currentQuestion = null
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
httpServer.listen(port, () => {
  console.log(`🚀 WebSocket server running on port ${port}`)
  console.log(`📡 Socket.IO endpoint: http://localhost:${port}`)
})
