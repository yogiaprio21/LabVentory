const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { padding-bottom: 30px; border-bottom: 2px solid #f3f4f6; text-align: center; }
    .footer { padding-top: 30px; border-top: 2px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center; }
    .content { padding: 30px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
    .badge-blue { background-color: #eff6ff; color: #1e40af; }
    .badge-red { background-color: #fef2f2; color: #991b1b; }
    .label { font-weight: bold; color: #111827; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #4f46e5; margin: 0;">LabVentory</h1>
      <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Laboratory Management System</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LabVentory. This is an automated notification.</p>
    </div>
  </div>
</body>
</html>
`

const borrowingApproved = (user, inventory) => ({
  subject: `Approved: ${inventory.name}`,
  html: baseLayout(`
    <h2>Request Approved!</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>Good news! Your request to borrow the following equipment has been approved:</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0;"><span class="label">Item:</span> ${inventory.name}</p>
      <p style="margin: 5px 0 0 0;"><span class="label">Status:</span> <span class="badge badge-blue">Ready for Pickup</span></p>
    </div>
    <p>Please visit the laboratory to pick up your item. Remember to check the condition of the equipment before use.</p>
  `)
})

const borrowingRejected = (user, inventory) => ({
  subject: `Update: Borrowing Request for ${inventory.name}`,
  html: baseLayout(`
    <h2>Request Update</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>We're writing to inform you that your request for <strong>${inventory.name}</strong> could not be approved at this time.</p>
    <p>This usually happens due to maintenance schedules or insufficient stock for the requested period. Please contact your Lab Administrator for more details.</p>
  `)
})

const borrowingLate = (user, inventory) => ({
  subject: `URGENT: ${inventory.name} is Overdue`,
  html: baseLayout(`
    <h2 style="color: #dc2626;">Overdue Notification</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>The borrowing period for <strong>${inventory.name}</strong> has expired, and the item has been marked as <span class="badge badge-red">LATE</span>.</p>
    <p>Please return the equipment to the laboratory <strong>immediately</strong> to avoid potential penalties and ensure other students can use it.</p>
    <a href="#" class="button" style="background-color: #dc2626;">View Borrowing History</a>
  `)
})

const dueReminder = (user, inventory) => ({
  subject: 'Reminder: Return Due Tomorrow',
  html: baseLayout(`
    <h2>Return Due Soon</h2>
    <p>Hello <strong>${user.name}</strong>,</p>
    <p>This is a friendly reminder that you have equipment due for return tomorrow.</p>
    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <p style="margin: 0;"><span class="label">Item:</span> ${inventory.name}</p>
      <p style="margin: 5px 0 0 0;"><span class="label">Due Date:</span> Tomorrow</p>
    </div>
    <p>Please ensure the equipment is clean and in good condition before returning it.</p>
  `)
})

const criticalStockAlert = (admin, inventory, currentStock) => ({
  subject: `CRITICAL STOCK: ${inventory.name}`,
  html: baseLayout(`
    <h2 style="color: #dc2626;">Low Stock Alert</h2>
    <p>Hello <strong>${admin.name}</strong>,</p>
    <p>This is an automated alert regarding laboratory inventory levels.</p>
    <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border: 1px solid #fee2e2; margin: 20px 0;">
      <p style="margin: 0;"><span class="label">Equipment:</span> ${inventory.name}</p>
      <p style="margin: 5px 0;"><span class="label">Current Stock:</span> <span style="color: #dc2626; font-weight: bold;">${currentStock}</span></p>
      <p style="margin: 5px 0 0 0;"><span class="label">Threshold:</span> ${inventory.minStock}</p>
    </div>
    <p>Inventory level for this item has fallen below your defined threshold. Please review and consider restocking.</p>
    <a href="#" class="button">Manage Inventory</a>
  `)
})

module.exports = { borrowingApproved, borrowingRejected, borrowingLate, dueReminder, criticalStockAlert }
