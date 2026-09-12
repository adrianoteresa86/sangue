import { jwtServico } from '../autenticacao/jwt.servico';

export class SessaoServico {
  private mapaUltimaActividade = new Map<string, number>();
  private tempoInactividadeMs: number;

  constructor(tempoInactividadeMs = 1800000) { // 30 minutos por padrão
    this.tempoInactividadeMs = tempoInactividadeMs;
  }

  actualizarUltimaActividade(token: string): void {
    try {
      const cargo = jwtServico.analisarToken(token);
      this.mapaUltimaActividade.set(cargo.sub, Date.now());
    } catch {
      // Token inválido, ignorar
    }
  }

  tokenValidoPorActividade(token: string): boolean {
    try {
      const cargo = jwtServico.analisarToken(token);
      const idUsuario = cargo.sub;
      const ultimaActividade = this.mapaUltimaActividade.get(idUsuario);

      if (ultimaActividade === undefined) {
        this.mapaUltimaActividade.set(idUsuario, Date.now());
        return true;
      }

      const tempoInactividade = Date.now() - ultimaActividade;

      if (tempoInactividade > this.tempoInactividadeMs) {
        this.mapaUltimaActividade.delete(idUsuario);
        return false;
      }

      this.mapaUltimaActividade.set(idUsuario, Date.now());
      return true;
    } catch {
      return false;
    }
  }

  invalidarSessao(token: string): void {
    try {
      const cargo = jwtServico.analisarToken(token);
      this.mapaUltimaActividade.delete(cargo.sub);
    } catch {
      // Token inválido, ignorar
    }
  }

  limparSessoesExpiradas(): void {
    const agora = Date.now();
    for (const [idUsuario, ultimaActividade] of this.mapaUltimaActividade.entries()) {
      if (agora - ultimaActividade > this.tempoInactividadeMs) {
        this.mapaUltimaActividade.delete(idUsuario);
      }
    }
  }
}

export const sessaoServico = new SessaoServico(
  Number(process.env.SESSION_INACTIVITY_MS) || 1800000
);
