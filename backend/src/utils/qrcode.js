const QRCode = require('qrcode')

const generateQrDataUrl = async (text) => {
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M' })
}

module.exports = { generateQrDataUrl }
