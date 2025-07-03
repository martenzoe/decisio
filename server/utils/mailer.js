// server/utils/mailer.js
import 'dotenv/config'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteMail({ to, from = process.env.FROM_EMAIL, inviterNickname, decisionName, inviteToken }) {
  const subject = 'Du wurdest zu einer Entscheidung eingeladen'

  const inviteLink = inviteToken
    ? `https://decisia.de/register?invite=${inviteToken}`
    : `https://decisia.de`

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Einladung zu Decisia</h2>
      <p><strong>${inviterNickname}</strong> hat dich zur gemeinsamen Entscheidung <strong>"${decisionName}"</strong> eingeladen.</p>
      <p>Klicke hier, um teilzunehmen: <a href="${inviteLink}" target="_blank">${inviteLink}</a></p>
    </div>
  `

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    return response
  } catch (error) {
    console.error('Mailversand fehlgeschlagen:', error)
    throw error
  }
}
