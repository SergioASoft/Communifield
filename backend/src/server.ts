import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import userRoutes from "./routes/userRoutes"
import authRoutes from "./modules/auth.routes"



dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use("/users", userRoutes)
app.use("/auth", authRoutes)


app.get("/", (req, res) => {
    res.send("CommuniField API running")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})