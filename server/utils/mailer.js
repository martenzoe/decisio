import 'dotenv/config'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteMail({
  to,
  from = process.env.FROM_EMAIL,
  inviterNickname,
  decisionName,
  inviteToken
}) {
  const subject = 'Du wurdest zu einer Entscheidung eingeladen'

  // 🌍 Umgebung unterscheiden: lokal oder deployed?
  const baseUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:5173'
    : 'https://decisia.de'

  const inviteLink = inviteToken
    ? `${baseUrl}/invite?token=${inviteToken}`
    : baseUrl

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Einladung zu Decisia</h2>
      <p><strong>${inviterNickname}</strong> hat dich zur gemeinsamen Entscheidung <strong>"${decisionName}"</strong> eingeladen.</p>
      <p>Klicke hier, um teilzunehmen:</p>
      <p><a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Einladung annehmen</a></p>
      <p>Oder öffne diesen Link im Browser:<br>${inviteLink}</p>
    </div>
  `

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    return response
  } catch (error) {
    console.error('Mailversand fehlgeschlagen:', error)
    throw error
  }
}
