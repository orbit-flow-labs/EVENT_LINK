import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

/**
 * 1. Dispatch Account Registration Welcome Email
 */
export async function sendRegistrationEmail(
  toEmail: string,
  fullName: string,
  custodialPublicKey: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #040711; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h2 style="color: #00f2fe; margin-bottom: 8px;">Welcome to EventLink!</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hi <strong>${fullName}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Your EventLink account has been created successfully. An automated gasless Stellar Testnet custodial keypair has been provisioned for your account.
      </p>
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(0,242,254,0.3); padding: 16px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 13px;">
        <span style="color: #00f2fe; display: block; margin-bottom: 4px;">Stellar Custodial Key:</span>
        <strong style="color: #ffffff;">${custodialPublicKey}</strong>
      </div>
      <p style="font-size: 12px; color: #64748b;">Powered by EventLink • Stellar Soroban Smart Tickets</p>
    </div>
  `;

  return deliverMail(toEmail, 'Welcome to EventLink — Account & Stellar Key Created', html);
}

/**
 * 2. Dispatch Ticket Purchase Confirmation Email
 */
export async function sendPurchaseConfirmationEmail(
  toEmail: string,
  fullName: string,
  ticket: any
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #040711; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h2 style="color: #00f2fe; margin-bottom: 8px;">🎟️ Your Event Ticket is Confirmed & Minted!</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hi <strong>${fullName}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Thank you for purchasing a ticket to <strong>${ticket.eventTitle}</strong>. Your ticket asset has been minted on Stellar Testnet!
      </p>
      
      <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(112,0,255,0.4); padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Ticket ID:</strong> <span style="color: #00f2fe;">${ticket.id}</span></p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Tier:</strong> ${ticket.tierName}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Claim Secret Code:</strong> <span style="color: #a855f7; font-family: monospace; font-weight: bold;">${ticket.claimCode}</span></p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Soroban Contract ID:</strong> <span style="font-family: monospace; font-size: 11px;">${ticket.sorobanContractId}</span></p>
      </div>

      <a href="${ticket.claimUrl || `http://localhost:5179/?claimCode=${ticket.claimCode}`}" 
         style="display: inline-block; background: linear-gradient(135deg, #7000ff, #00f2fe); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px;">
        Claim to Web3 Self-Custody Wallet
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Powered by EventLink • Soroban Smart Contracts</p>
    </div>
  `;

  return deliverMail(toEmail, `Ticket Confirmed: ${ticket.eventTitle}`, html);
}

/**
 * 3. Dispatch Web3 Wallet Claim Confirmation Email
 */
export async function sendClaimConfirmationEmail(
  toEmail: string,
  fullName: string,
  ticket: any,
  walletAddress: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #040711; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h2 style="color: #10b981; margin-bottom: 8px;">🔐 Ticket Ownership Claimed!</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hi <strong>${fullName}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Ownership of your ticket asset for <strong>${ticket.eventTitle}</strong> has been transferred from custodial storage to your personal Web3 wallet.
      </p>
      <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 16px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 13px;">
        <span style="color: #10b981; display: block; margin-bottom: 4px;">Destination Wallet Address:</span>
        <strong style="color: #ffffff;">${walletAddress}</strong>
      </div>
      <p style="font-size: 12px; color: #64748b;">Powered by EventLink • Stellar Soroban Smart Contracts</p>
    </div>
  `;

  return deliverMail(toEmail, `Ticket Claimed to Web3 Wallet: ${ticket.eventTitle}`, html);
}

/**
 * 4. Dispatch Gate Check-In Successful Email
 */
export async function sendGateCheckinEmail(
  toEmail: string,
  fullName: string,
  ticket: any,
  scannerTerminalId: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #040711; color: #ffffff; padding: 32px; border-radius: 16px;">
      <h2 style="color: #3b82f6; margin-bottom: 8px;">✅ Gate Check-In Verified!</h2>
      <p style="font-size: 15px; color: #cbd5e1;">Hi <strong>${fullName}</strong>,</p>
      <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
        Your ticket pass for <strong>${ticket.eventTitle}</strong> has been successfully scanned and verified at the venue gate!
      </p>
      <div style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); padding: 16px; border-radius: 12px; margin: 20px 0; font-family: monospace; font-size: 13px;">
        <span style="color: #3b82f6; display: block; margin-bottom: 4px;">Gate Scanner Terminal:</span>
        <strong style="color: #ffffff;">${scannerTerminalId}</strong>
        <span style="color: #94a3b8; display: block; margin-top: 6px;">Check-In Timestamp: ${new Date().toLocaleString()}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">Powered by EventLink • Stellar Soroban Smart Contracts</p>
    </div>
  `;

  return deliverMail(toEmail, `✅ Gate Check-In Verified: ${ticket.eventTitle}`, html);
}

let etherealTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<{ transporter: nodemailer.Transporter; senderEmail: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (user && pass) {
    console.log(`📧 Configured Real SMTP Transporter active for sender: ${user}`);
    const realTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
    return { transporter: realTransporter, senderEmail: user };
  }

  if (!etherealTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✉️ Ethereal Sandbox SMTP Transporter initialized! Sandbox Account: ${testAccount.user}`);
    } catch (err) {
      console.warn('Ethereal test account initialization warning:', err);
      const fallbackTransporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      return { transporter: fallbackTransporter, senderEmail: user || 'no-reply@eventlink.app' };
    }
  }

  return { transporter: etherealTransporter, senderEmail: 'no-reply@eventlink.app' };
}

/**
 * Helper to dispatch email via Nodemailer & return live preview URL
 */
async function deliverMail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { transporter: activeTransporter, senderEmail } = await getTransporter();
    const info = await activeTransporter.sendMail({
      from: `"EventLink Platform" <${senderEmail}>`,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n==================================================`);
      console.log(`📩 ETHEREAL TEST EMAIL SENT TO: ${to}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`🔗 VIEW EMAIL LIVE IN BROWSER: ${previewUrl}`);
      console.log(`==================================================\n`);
    } else {
      console.log(`\n==================================================`);
      console.log(`📩 REAL SMTP EMAIL DELIVERED TO INBOX: ${to}`);
      console.log(`📌 Subject: ${subject}`);
      console.log(`✉️ Sent via: ${senderEmail}`);
      console.log(`==================================================\n`);
    }

    return true;
  } catch (error) {
    console.error('[SMTP ERROR] Failed to send email via Nodemailer:', error);
    return false;
  }
}
