import client from './client'
import type { Token, User, UserCreate } from '../types'

export const authApi = {
  login: async (email: string, password: string): Promise<Token> => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    const { data } = await client.post<Token>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await client.get<User>('/auth/me')
    return data
  },

  listUsers: async (): Promise<User[]> => {
    const { data } = await client.get<User[]>('/auth/users')
    return data
  },

  createUser: async (payload: UserCreate): Promise<User> => {
    const { data } = await client.post<User>('/auth/register', payload)
    return data
  },
}
