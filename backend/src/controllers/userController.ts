import { Request, Response } from "express"
import { findUsers } from "../services/userService"

export const getUsers = async (req: Request, res: Response) => {

 const users = await findUsers()

 res.json(users)

}