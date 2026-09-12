import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, MessageCircle, Send, Sparkles, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { boasVindas } from '../../chatbot/conhecimento';
import { responder } from '../../chatbot/motor';
import type { Mensagem, PerfilUsuario, RespostaBot } from '../../chatbot/tipos';

const PREFIXO_STORAGE = 'sanguinha:conversa:';

/** Atraso mínimo antes de mostrar a resposta — evita respostas "instantâneas" e artificiais. */
const ATRASO_MINIMO_MS = 450;

function criarId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mensagemDoBot(resposta: RespostaBot): Mensagem {
  return {
    id: criarId(),
    autor: 'bot',
    texto: resposta.texto,
    hora: new Date().toISOString(),
    sugestoes: resposta.sugestoes,
    accoes: resposta.accoes,
  };
}

function mensagemDoUtilizador(texto: string): Mensagem {
  return { id: criarId(), autor: 'utilizador', texto, hora: new Date().toISOString() };
}

function carregar(chave: string): Mensagem[] {
  try {
    const guardado = sessionStorage.getItem(chave);
    const analisado = guardado ? JSON.parse(guardado) : null;
    return Array.isArray(analisado) ? (analisado as Mensagem[]) : [];
  } catch {
    return [];
  }
}

function guardar(chave: string, mensagens: Mensagem[]): void {
  try {
    sessionStorage.setItem(chave, JSON.stringify(mensagens));
  } catch {
    // sessionStorage indisponível (modo privado, quota) — a conversa vive só em memória.
  }
}

const esperar = (ms: number) => new Promise<void>((resolver) => setTimeout(resolver, ms));

const formatarHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

/** Formatação leve: `**negrito**`, `_itálico_` e quebras de linha. */
function TextoFormatado({ texto }: { texto: string }) {
  return (
    <>
      {texto.split('\n').map((linha, indiceLinha) => {
        if (linha.trim() === '') return <div key={indiceLinha} className="h-2" />;
        return (
          <p key={indiceLinha} className="whitespace-pre-wrap">
            {linha.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((parte, indice) => {
              if (parte.startsWith('**') && parte.endsWith('**')) {
                return <strong key={indice}>{parte.slice(2, -2)}</strong>;
              }
              if (parte.length > 2 && parte.startsWith('_') && parte.endsWith('_')) {
                return (
                  <em key={indice} className="opacity-80">
                    {parte.slice(1, -1)}
                  </em>
                );
              }
              return <span key={indice}>{parte}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

function IndicadorEscrita() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
      {[0, 150, 300].map((atraso) => (
        <span
          key={atraso}
          className="h-2 w-2 animate-bounce rounded-full bg-primary/60"
          style={{ animationDelay: `${atraso}ms` }}
        />
      ))}
    </div>
  );
}

interface PainelProps {
  chaveArmazenamento: string;
  perfil: PerfilUsuario | null;
  primeiroNome: string | null;
  fechar: () => void;
}

/**
 * Painel de conversa. É remontado (via `key`) sempre que muda o utilizador,
 * o que reinicia o estado a partir do `sessionStorage` desse utilizador.
 */
function PainelConversa({ chaveArmazenamento, perfil, primeiroNome, fechar }: PainelProps) {
  const navigate = useNavigate();

  const [mensagens, setMensagens] = useState<Mensagem[]>(() => {
    const guardadas = carregar(chaveArmazenamento);
    return guardadas.length > 0 ? guardadas : [mensagemDoBot(boasVindas(primeiroNome))];
  });
  const [entrada, setEntrada] = useState('');
  const [aEscrever, setAEscrever] = useState(false);

  const mensagensRef = useRef(mensagens);
  const fimRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  const definirMensagens = useCallback(
    (proximas: Mensagem[], persistir = true) => {
      mensagensRef.current = proximas;
      setMensagens(proximas);
      if (persistir) guardar(chaveArmazenamento, proximas);
    },
    [chaveArmazenamento]
  );

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens, aEscrever]);

  useEffect(() => {
    campoRef.current?.focus();
  }, []);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [fechar]);

  const enviar = useCallback(
    async (texto: string) => {
      const limpo = texto.trim();
      if (!limpo || aEscrever) return;

      definirMensagens([...mensagensRef.current, mensagemDoUtilizador(limpo)]);
      setEntrada('');
      setAEscrever(true);

      try {
        const [resposta] = await Promise.all([
          responder(limpo, perfil, primeiroNome),
          esperar(ATRASO_MINIMO_MS),
        ]);
        definirMensagens([...mensagensRef.current, mensagemDoBot(resposta)]);
      } finally {
        setAEscrever(false);
      }
    },
    [aEscrever, definirMensagens, perfil, primeiroNome]
  );

  const limpar = useCallback(() => {
    try {
      sessionStorage.removeItem(chaveArmazenamento);
    } catch {
      // ignorado — ver `guardar`
    }
    definirMensagens([mensagemDoBot(boasVindas(primeiroNome))], false);
  }, [chaveArmazenamento, definirMensagens, primeiroNome]);

  const ultima = mensagens[mensagens.length - 1];
  const sugestoes = !aEscrever && ultima?.autor === 'bot' ? (ultima.sugestoes ?? []) : [];

  return (
    <div
      role="dialog"
      aria-label="Sanguinha, assistente virtual"
      className="fixed inset-x-4 bottom-24 z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-neutral shadow-2xl sm:left-auto sm:right-6 sm:w-95"
      style={{ height: 'min(560px, calc(100vh - 8rem))' }}
    >
      <header className="flex items-center gap-3 bg-linear-to-r from-primary-dark to-primary-intense px-4 py-3 text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Droplet className="h-5 w-5" fill="currentColor" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">Sanguinha</p>
          <p className="flex items-center gap-1.5 text-xs text-red-100">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Assistente virtual
          </p>
        </div>
        <button
          type="button"
          onClick={limpar}
          title="Limpar conversa"
          aria-label="Limpar conversa"
          className="rounded-lg p-2 transition-colors hover:bg-white/15"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={fechar}
          title="Fechar"
          aria-label="Fechar conversa"
          className="rounded-lg p-2 transition-colors hover:bg-white/15"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {mensagens.map((mensagem) => {
          const doBot = mensagem.autor === 'bot';
          return (
            <div key={mensagem.id} className={`flex ${doBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] ${doBot ? '' : 'flex flex-col items-end'}`}>
                <div
                  className={
                    doBot
                      ? 'rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-gray-800 shadow-sm'
                      : 'rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm'
                  }
                >
                  <TextoFormatado texto={mensagem.texto} />
                </div>

                {mensagem.accoes && mensagem.accoes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {mensagem.accoes.map((accao) => (
                      <button
                        key={accao.rota + accao.rotulo}
                        type="button"
                        onClick={() => {
                          navigate(accao.rota);
                          fechar();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-intense"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {accao.rotulo}
                      </button>
                    ))}
                  </div>
                )}

                <time dateTime={mensagem.hora} className="mt-1 block px-1 text-[10px] text-gray-400">
                  {formatarHora(mensagem.hora)}
                </time>
              </div>
            </div>
          );
        })}

        {aEscrever && (
          <div className="flex justify-start">
            <IndicadorEscrita />
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {sugestoes.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-gray-200 bg-white px-3 py-2 scrollbar-hide">
          {sugestoes.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => enviar(sugestao)}
              className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary-intense transition-colors hover:bg-primary/10"
            >
              {sugestao}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar(entrada);
        }}
        className="flex items-center gap-2 border-t border-gray-200 bg-white p-3"
      >
        <input
          ref={campoRef}
          value={entrada}
          onChange={(evento) => setEntrada(evento.target.value)}
          placeholder="Escreve a tua pergunta…"
          aria-label="Mensagem para a Sanguinha"
          maxLength={500}
          className="min-w-0 flex-1 rounded-full border border-gray-300 bg-neutral px-4 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white"
        />
        <button
          type="submit"
          disabled={!entrada.trim() || aEscrever}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-intense disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

export function Sanguinha() {
  const { usuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [jaAbriu, setJaAbriu] = useState(false);

  const fechar = useCallback(() => setAberto(false), []);

  return (
    <>
      {aberto && (
        <PainelConversa
          // Muda de utilizador ⇒ painel remontado ⇒ conversa desse utilizador.
          key={usuario?.id ?? 'publico'}
          chaveArmazenamento={`${PREFIXO_STORAGE}${usuario?.id ?? 'publico'}`}
          perfil={usuario?.perfil ?? null}
          primeiroNome={usuario?.nome?.trim().split(' ')[0] ?? null}
          fechar={fechar}
        />
      )}

      <button
        type="button"
        onClick={() => {
          setAberto((anterior) => !anterior);
          setJaAbriu(true);
        }}
        aria-label={aberto ? 'Fechar a Sanguinha' : 'Abrir a Sanguinha, assistente virtual'}
        aria-expanded={aberto}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary-dark text-white shadow-xl transition-transform hover:scale-105 active:scale-95 sm:right-6"
      >
        {aberto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!aberto && !jaAbriu && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-accent" />
          </span>
        )}
      </button>
    </>
  );
}
