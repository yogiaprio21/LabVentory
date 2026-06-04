const { getAccessControlMatrix, getRolePermissions } = require('../config/access-control')

const matrix = async (req, res) => {
  res.json(getAccessControlMatrix())
}

const me = async (req, res) => {
  res.json({
    role: req.user.role,
    permissions: getRolePermissions(req.user.role)
  })
}

module.exports = { matrix, me }
