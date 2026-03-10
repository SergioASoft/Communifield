import db from "../config/database"

export const getUsers = async () => {

 const [rows] = await db.query("SELECT * FROM users")

 return rows

}