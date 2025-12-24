import express from 'express'
import 'dotenv/config'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PrismaClient } = require('./generated/prisma')
const { PrismaPg } = require('@prisma/adapter-pg')

const app = express()
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello, this is my server web point for my journal backend!!!!!!')});

// Creates a GET endpoint for all the journal entries 
app.get('/entries', async (req, res) => {
    const entries = await prisma.journalEntry.findMany()
    res.json(entries)
})

// GET endpoint to get the single journal entry
app.get('/entries/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const entry = await prisma.journalEntry.findUnique({ 
        where: { id } 
    })
    res.json(entry)
  } catch (error) {
    res.status(404).json({ 
        error: 'The entry cannot found!' 
    })
  }
})

// Creates a post endpoint to add a new journal entry
app.post('/entries', async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) 
    return res.status(400).json({ 
        error: 'Title and content are required' 
    })

  const entry = await prisma.journalEntry.create({ 
    data: { 
        title, 
        content } 
    })
  res.status(201).json(entry);
})

// PUT endpoint to update an journal entry that already exists
app.put('/entries/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body;

  try {
    const entry = await prisma.journalEntry.update({
      where: { id },
      data: { title, content },

    })
    res.json(entry);
    } catch (error) {
    res.status(404).json({ 
        error: 'The entry cannot be found!' 
    });
  }
})

// DELETE endpoint to delete a journal entry
app.delete('/entries/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.journalEntry.delete({ 
        where: { id } 
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