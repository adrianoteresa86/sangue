import { emailServico } from './email.servico';
import { smsServico } from './sms.servico';
import { notificacaoServico } from './notificacao.servico';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';
import { Usuario } from '../entidades/Usuario';

export class ComunicacaoServico {
  private gerarTemplateEmail(nomeUsuario: string, titulo: string, mensagem: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Sangue</h1>
          <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 14px;">Sistema de Gestão de Sangue de Angola</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">${titulo}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Olá, <strong>${nomeUsuario}</strong>,</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">${mensagem}</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            Este é um email automático enviado pelo sistema Sangue. Por favor, não responda a este endereço.
          </p>
        </div>
      </div>
    `;
  }

  async notificarUsuario(
    usuario: Usuario,
    titulo: string,
    mensagem: string,
    tipo: TipoNotificacao,
    enviarEmail = false,
    enviarSms = false
  ): Promise<void> {
    await notificacaoServico.criar({
      idDestinatario: usuario.id,
      titulo,
      mensagem,
      tipo,
    });

    if (enviarEmail && usuario.email) {
      const htmlCorpo = this.gerarTemplateEmail(usuario.nome || 'Utilizador', titulo, mensagem);
      await emailServico.enviarEmail(usuario.email, titulo, htmlCorpo);
    }

    if (enviarSms && usuario.telefone) {
      await smsServico.enviarSms(usuario.telefone, `${titulo}: ${mensagem}`);
    }
  }

  async enviarLembreteDoacao(usuario: Usuario, dataDoacao: Date): Promise<void> {
    const dataFormatada = dataDoacao.toLocaleDateString('pt-PT');
    await this.notificarUsuario(
      usuario,
      'Lembrete de Doação',
      `Você tem uma doação agendada para ${dataFormatada}. Não se esqueça!`,
      TipoNotificacao.LEMBRETE_DOACAO,
      true,
      false
    );
  }

  async enviarConfirmacaoDoacao(usuario: Usuario): Promise<void> {
    await this.notificarUsuario(
      usuario,
      'Doação Confirmada',
      'A sua doação de sangue foi registada com sucesso. Obrigado por salvar vidas!',
      TipoNotificacao.DOACAO_CONFIRMADA,
      true,
      false
    );
  }

  async enviarAlertaUrgenciaSangue(usuarios: Usuario[], tipoSangue: string): Promise<void> {
    for (const usuario of usuarios) {
      await this.notificarUsuario(
        usuario,
        'Urgência de Sangue',
        `Há uma necessidade urgente de sangue do tipo ${tipoSangue}. Por favor, considere doar!`,
        TipoNotificacao.URGENCIA_SANGUE,
        true,
        true
      );
    }
  }
}

export const comunicacaoServico = new ComunicacaoServico();
