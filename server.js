import express from 'express'
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const app = express()
const prisma = new PrismaClient()

app.get('/', (req, res) => {
    res.send('Hello, this is my server web point for my journal backend!!!!!!')});

app.get('/entries', async (req, res) => {
    const entries = await prisma.journalEntry.findMany()
    res.json(entries)
})

app.listen(4000, () => {
    console.log("Server is running on localhost:4000")
})