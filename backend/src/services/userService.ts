import { getUsers } from "../repositories/userRepository"

export const findUsers = async () => {

 return await getUsers()

}