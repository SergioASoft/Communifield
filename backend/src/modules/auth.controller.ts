import { Request, Response } from "express"
import { loginUser } from "./auth.service"

export const login = async (req: Request, res: Response) => {

    const { email, password } = req.body

    try {

        const token = await loginUser(email, password)

        return res.json({
            message: "Login successful",
            token
        })

    } catch (error: any) {

        return res.status(401).json({
            message: error.message
        })

    }

}