export type Role = 'superadmin' | 'admin' | 'student'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  labId: number | null
  lab?: Lab
}

export type Lab = { id: number; name: string; location: string }

export type Category = { id: number; name: string; labId: number }

export type Inventory = {
  id: number
  name: string
  categoryId: number
  labId: number
  totalStock: number
  availableStock: number
  minStock: number
  location?: string
  condition?: string
  qrCodeUrl?: string
  lab?: Lab
}

export type BorrowStatus = 'pending' | 'approved' | 'rejected' | 'returned' | 'late'
export type Borrowing = {
  id: number
  userId: number
  inventoryId: number
  quantity: number
  borrowDate: string
  dueDate: string
  returnDate?: string | null
  status: BorrowStatus
  user?: User
  inventory?: Inventory
}

export type AuditLog = {
  id: number
  userId: number
  action: string
  entity: string
  entityId: number
  details?: any
  timestamp: string
  user?: User
}
