import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'

// Authentication imports
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Imported these modules because I kept getting an error with Prisma when trying to run the backend server
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('./generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')

dotenv.config()

const app = express()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const secret = process.env.JWT_SECRET
app.use(express.json())

// CORS middleware to allow requests from the frontend
app.use(cors( {
    origin: 'http://localhost:5173',
    methods: [
        'GET', 
        'POST', 
        'PUT', 
        'DELETE'],
    credentials: true,
} )) 

app.get('/', (req, res) => {
    res.send('Hello, this is my server web point for my journal backend!!!!!!')});

// Creates a POST endpoint that registers a new user using a unique email and a hashed password
app.post("/register", async (req, res) => {

    try {
        const {email, password} = req.body
        const existingUser = await prisma.user.findUnique({ 
            where: {email: email},

    })
    if (existingUser) {
        return res.status(400).json({ 
            error: "Email already registered!" 
        })
    }

        const hashedPassword = await bcrypt.hash(password, 10) 
        const user = await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
        }
    }) 
    res.status(201).json(user) //checks for the error and simplifies error
    } catch (error) {
        res.status(500).json({ 
            error: "There is an error with the server!", 
            details: String(error) 
        })
    }
})

app.post("/login", async (req, res) => {

        const { email, password } = req.body
        // Checks if the user exists in the database
        const user = await prisma.user.findUnique({ 
            where: { email: email } 
        })

        if (!user) {
            return res.status(400).json({ 
                error: "Unauthorized! User not found!!!" 
            })
        }

        // Compares the password with the hashed password 
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                error: "Invalid password!"
            })
        }

        // Generates a JWT token for user
        const token = jwt.sign({userId: user.id}, secret, { expiresIn: '1hr'})
        res.json({token})
})

// MIDDLEWARE
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res.status(401).json({ 
            error: "No token found!" 
        })
    }
    //split into an array 
    // ex: [Token, 123919343]
    try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, secret)
        req.user = decoded
        next()
    } catch (error) {
        console.log(error)
        res.status(401).json({ 
            error: "Invalid token!" 
        })
    }
}
// a GET endpoint that returns an existing user's information
app.get('/me', authMiddleware, async (req, res) => {
    const userId = req.user.userId
    console.log(req.user)
    const user = await prisma.user.findUnique({
        where: { id: userId },
    })
    res.json(user)
})

// Creates a GET endpoint for all the journal entries 
app.get('/entries', authMiddleware, async (req, res) => {
    const {userId} = req.user
    const entries = await prisma.journalEntry.findMany({
        where: {userId: userId}
    })
    res.json(entries)
})

// GET endpoint to get the single journal entry
app.get('/entries/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  const userId = req.user.userId

  try {
    const entry = await prisma.journalEntry.findUnique({ 
        where: { id } 
    })

    // Other users cannot see another users entries
    if (!entry || entry.userId !== userId) {
        return res.status(404).json({error: "Task not found"})
    }

    res.json(entry)
  } catch (error) {
    res.status(404).json({ 
        error: 'The entry cannot found!' 
    })
  }
})

// Creates a post endpoint to add a new journal entry with title, content, and mood field
app.post('/entries', authMiddleware, async (req, res) => {
  const { title, content, mood } = req.body
  const userId = req.user.userId

  if (!title || !content) 
    return res.status(400).json({ 
        error: 'Title and content are required' 
    })

  const entry = await prisma.journalEntry.create({ 
    data: { 
        title, 
        content,
        mood,
        userId,
    } 
    })
  res.status(201).json(entry)
})

// PUT endpoint to update an journal entry that already exists
app.put('/entries/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  const { title, content, mood } = req.body
  const userId = req.user.userId

  try {
    const existingEntry = await prisma.journalEntry.findUnique({where: {id}})
    if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(404).json({ error: "Task not found!"})
    }
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { 
        title, 
        content,
        mood,
        userId
    },

    })
    res.json(entry)
    } catch (error) {
    res.status(404).json({ 
        error: 'The entry cannot be found!' 
    });
  }
})

// DELETE endpoint to delete a journal entry
app.delete('/entries/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id)
  const userId = req.user.userId

  try {
    const existingEntry = await prisma.journalEntry.findUnique({where: {id}})
    if (!existingEntry || existingEntry.userId !== userId) {
        return res.status(404).json({ error: "Task not found!"})
    }
    await prisma.journalEntry.delete({
        where: {id},
    })
    res.status(204).send()
    } catch (error) {
    res.status(404).json({ 
        error: 'The entry cannot be found!' 
    })
  }
})

// Start the server on localhost:4000
app.listen(4000, () => {
    console.log("Server is running on localhost:4000")
})