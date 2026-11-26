import {
  AccountStatus,
  UserRole,
  VerificationStatus,
} from '../models/User.model'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: UserRole
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
