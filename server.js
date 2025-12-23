import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send('Hello, this is my server web point for my journal backend!!!!!!')});

app.get('/entries', (req, res) => {
    res.json(([
        {
            id: 1, 
            title: "First Entry",
            content: "This is my first journal entry."
        },
        {
            id: 2,
            title: "Second Entry",
            content: "This is my second journal entry."
        }
    ]))
})

app.listen(4000, () => {
    console.log("Server is running on localhost:4000")
})