import 'dotenv/config'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteMail({
  to,
  from = process.env.FROM_EMAIL,
  inviterNickname,
  decisionName
}) {
  const subject = 'Du wurdest zu einer Entscheidung eingeladen'

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Einladung zu Decisia</h2>
      <p><strong>${inviterNickname}</strong> hat dich zur gemeinsamen Entscheidung <strong>"${decisionName}"</strong> eingeladen.</p>
      <p>Bitte öffne die Decisia App, um die Einladung direkt dort anzunehmen.</p>
      <p>Du findest die Einladung nach dem Login in deiner Benachrichtigungsglocke.</p>
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
