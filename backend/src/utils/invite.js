const crypto = require('crypto')

const createInviteCode = () => crypto.randomBytes(18).toString('base64url')

const isInviteUsable = (invite, now = new Date()) => (
  invite &&
  invite.status === 'active' &&
  invite.expiresAt > now &&
  invite.usedCount < invite.maxUses &&
  invite.institution?.status === 'active'
)

module.exports = { createInviteCode, isInviteUsable }
