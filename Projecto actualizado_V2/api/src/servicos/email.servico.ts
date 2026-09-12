import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailServico {
  private transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async enviarEmail(para: string, assunto: string, corpo: string): Promise<void> {
    try {
      await this.transportador.sendMail({
        from: `"Sistema Sangue" <${process.env.EMAIL_FROM || 'adrianoteresa1986@gmail.com'}>`,
        to: para,
        subject: assunto,
        html: corpo,
      });
    } catch (erro) {
      console.error('Erro ao enviar email:', erro);
    }
  }
}

export const emailServico = new EmailServico();
