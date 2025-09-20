export interface User {
  _id: string
  email: string
  name: string
  image?: string
  role: 'student' | 'faculty' | 'admin' | 'superadmin'
  department?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  name: string
  image?: string
  role?: 'student' | 'faculty' | 'admin' | 'superadmin'
  department?: string
}
