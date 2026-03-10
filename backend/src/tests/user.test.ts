import request from "supertest"
import express from "express"

const app = express()

app.get("/users", (req, res) => {
  res.status(200).json([{ name: "test" }])
})

describe("GET /users", () => {

  it("should return users", async () => {

    const res = await request(app).get("/users")

    expect(res.status).toBe(200)

  })

})