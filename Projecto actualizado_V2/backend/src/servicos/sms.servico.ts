import dotenv from 'dotenv';

dotenv.config();

export class SmsServico {
  async enviarSms(para: string, mensagem: string): Promise<void> {
    // Implementação com Twilio ou outro provedor SMS
    // Por enquanto, apenas log
    // Exemplo com Twilio (descomente e instale o pacote twilio para activar):
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: mensagem,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: para,
    // });
  }
}

export const smsServico = new SmsServico();
