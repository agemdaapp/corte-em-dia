export {}

declare global {
  interface AuthenticatedUser {
    id: string
    email: string | null
    role: string | null
    name: string | null
  }

  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}


