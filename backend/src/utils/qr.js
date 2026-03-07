const QRCode = require('qrcode')

const generateQrDataUrl = async (text) => {
  return QRCode.toDataURL(text)
}

module.exports = { generateQrDataUrl }
