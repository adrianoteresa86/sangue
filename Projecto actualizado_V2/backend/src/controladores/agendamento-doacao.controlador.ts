import { Router, Response } from 'express';
import { agendamentoDoacaoServico } from '../servicos/agendamento-doacao.servico';
import { autenticacaoIntermediario, RequisicaoAutenticada } from '../intermediarios/autenticacao.intermediario';
import { exigirPerfil } from '../intermediarios/perfil.intermediario';
import { PerfilUsuario } from '../utilitarios/perfil-usuario.enum';
import { StatusDoacao } from '../utilitarios/status-doacao.enum';
import { notificacaoServico } from '../servicos/notificacao.servico';
import { TipoNotificacao } from '../utilitarios/tipo-notificacao.enum';
import { comunicacaoServico } from '../servicos/comunicacao.servico';
import { FonteDados } from '../configuracao/banco';
import { Usuario } from '../entidades/Usuario';

const roteador = Router();

// GET /api/v1/agendamentos-doacao - ADMIN, COORDENADOR, TECNICO
roteador.get('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.ADMIN, PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Listar todos os agendamentos'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      if (!usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Funcionário sem hemocentro vinculado' });
      }
      res.json(await agendamentoDoacaoServico.buscarPorHemocentro(usuarioLogado.hemocentroId));
    } else {
      res.json(await agendamentoDoacaoServico.buscarTodos());
    }
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/meus
roteador.get('/meus', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Listar os meus agendamentos'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await agendamentoDoacaoServico.buscarPorUsuario(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/meus/futuros
roteador.get('/meus/futuros', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Listar os meus agendamentos futuros'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await agendamentoDoacaoServico.buscarFuturosPorUsuario(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/meus/passados
roteador.get('/meus/passados', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Listar os meus agendamentos passados'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await agendamentoDoacaoServico.buscarPassadosPorUsuario(Number(req.usuario!.sub)));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/pode-doar
roteador.get('/pode-doar', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Verificar se posso doar e próxima data disponível'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const idUsuario = Number(req.usuario!.sub);
    const podeDoar = await agendamentoDoacaoServico.podeDoar(idUsuario);
    const proximaData = await agendamentoDoacaoServico.proximaDataDisponivel(idUsuario);
    res.json({ podeDoar, proximaDataDisponivel: proximaData });
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/hemocentro/:idHemocentro
roteador.get('/hemocentro/:idHemocentro', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Listar agendamentos por hemocentro'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const idHemocentro = Number(req.params.idHemocentro);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO) && idHemocentro !== usuarioLogado.hemocentroId) {
      return res.status(403).json({ erro: 'Não pode aceder agendamentos de outro hemocentro' });
    }
    res.json(await agendamentoDoacaoServico.buscarPorHemocentro(idHemocentro));
  } catch (erro: any) {
    res.status(500).json({ erro: erro.message });
  }
});

// GET /api/v1/agendamentos-doacao/:id
roteador.get('/:id', autenticacaoIntermediario, async (req, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Obter agendamento por ID'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    res.json(await agendamentoDoacaoServico.buscarPorId(Number(req.params.id)));
  } catch (erro: any) {
    res.status(404).json({ erro: erro.message });
  }
});

// POST /api/v1/agendamentos-doacao - cria agendamento
roteador.post('/', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.DOADOR), async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Criar agendamento de doação'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['idHemocentro', 'dataPreferida'],
             properties: {
               idHemocentro: { type: 'integer', example: 1 },
               dataPreferida: { type: 'string', format: 'date-time', example: '2024-06-20T08:00:00Z' },
               horaPreferida: { type: 'string', example: '08:00' },
               tipoSangue: { type: 'string', example: 'O+' },
               observacoes: { type: 'string', example: 'Prefiro manhã' },
               nomeContatoEmergencia: { type: 'string', example: 'Maria Silva' },
               telefoneContatoEmergencia: { type: 'string', example: '+258841234567' },
               cidade: { type: 'string', example: 'Maputo' }
             }
           }
         }
       }
     }
  */
  try {
    const agendamento = await agendamentoDoacaoServico.criar(req.body, Number(req.usuario!.sub));
    res.status(201).json(agendamento);

    // Notificar todos os admins (não bloqueia a resposta)
    FonteDados.getRepository(Usuario)
      .find({ where: { perfil: PerfilUsuario.ADMIN } })
      .then((admins) => {
        const dataFormatada = new Date(agendamento.dataPreferida).toLocaleDateString('pt-PT');
        const nomeHemocentro = agendamento.hemocentro?.nome ?? 'hemocentro';
        const tipoSangue = agendamento.tipoSangue ?? '';
        const nomeDoador = agendamento.usuario?.nome ?? 'Doador';
        
        admins.forEach(a => {
          comunicacaoServico.notificarUsuario(
            a,
            'Novo Agendamento de Doação',
            `${nomeDoador} agendou uma doação de sangue ${tipoSangue} para ${dataFormatada} em ${nomeHemocentro}.`,
            TipoNotificacao.NOTIFICACAO_ADMIN,
            true, // enviarEmail
            false // enviarSms
          ).catch(() => {});
        });
        
        if (agendamento.usuario) {
          comunicacaoServico.notificarUsuario(
            agendamento.usuario,
            'Agendamento Criado',
            `O seu agendamento para o dia ${dataFormatada} no hemocentro ${nomeHemocentro} foi criado com sucesso. Entraremos em contacto em breve para confirmação.`,
            TipoNotificacao.CONSULTA_AGENDADA,
            true, // enviarEmail
            false // enviarSms
          ).catch(() => {});
        }
      })
      .catch(() => {});
  } catch (erro: any) {
   
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/agendamentos-doacao/:id/status - ADMIN
roteador.patch('/:id/status', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Actualizar status do agendamento'
     #swagger.security = [{ "bearerAuth": [] }]
     #swagger.requestBody = {
       required: true,
       content: {
         "application/json": {
           schema: {
             type: 'object',
             required: ['status'],
             properties: {
               status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'CANCELLED'], example: 'COMPLETED' }
             }
           }
         }
       }
     }
  */
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!Object.values(StatusDoacao).includes(status)) {
      res.status(400).json({ erro: 'Status inválido' });
      return;
    }
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await agendamentoDoacaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar agendamento de outro hemocentro' });
      }
    }
    const agendamento = await agendamentoDoacaoServico.actualizarStatus(id, status);
    res.json(agendamento);

    // Notificar o doador sobre a mudança de status (não bloqueia a resposta)
    const MENSAGEM_STATUS: Record<StatusDoacao, string> = {
      [StatusDoacao.PENDENTE]:         'O seu agendamento está a aguardar confirmação.',
      [StatusDoacao.APROVADO]:         'O seu agendamento foi aprovado! Dirija-se ao hemocentro na data marcada para realizar a triagem.',
      [StatusDoacao.EM_PROCESSAMENTO]: 'A sua triagem clínica foi concluída. O seu sangue está em processamento laboratorial.',
      [StatusDoacao.CONCLUIDA]:        'A sua doação foi concluída com sucesso. Obrigado por salvar vidas!',
      [StatusDoacao.RECUSADO]:         'Infelizmente a sua doação não pôde ser aceite. Consulte o hemocentro para mais informações.',
      [StatusDoacao.CANCELADA]:                'O seu agendamento de doação foi cancelado.',
      [StatusDoacao.REAGENDAMENTO_SOLICITADO]: 'O seu pedido de reagendamento está a ser analisado pelo administrador.',
    };
    const idDoador = agendamento.usuario?.id;
    if (agendamento.usuario) {
      const dataFormatada = new Date(agendamento.dataPreferida).toLocaleDateString('pt-PT');
      const nomeHemocentro = agendamento.hemocentro?.nome ?? 'hemocentro';
      
      comunicacaoServico.notificarUsuario(
        agendamento.usuario,
        'Agendamento Actualizado',
        `${MENSAGEM_STATUS[status as StatusDoacao]} (${dataFormatada} em ${nomeHemocentro})`,
        TipoNotificacao.CONSULTA_AGENDADA,
        true, // enviarEmail
        false // enviarSms
      ).catch(() => {});
    }
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/agendamentos-doacao/:id/reagendar - próprio utilizador
roteador.patch('/:id/reagendar', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  try {
    const { dataPreferida, horaPreferida } = req.body;
    if (!dataPreferida) {
      res.status(400).json({ erro: 'Data preferida é obrigatória' });
      return;
    }
    const agendamento = await agendamentoDoacaoServico.reagendar(
      Number(req.params.id),
      Number(req.usuario!.sub),
      { dataPreferida: new Date(dataPreferida), horaPreferida },
    );
    res.json(agendamento);

    // Notificar admins sobre o pedido de reagendamento
    FonteDados.getRepository(Usuario)
      .find({ where: { perfil: PerfilUsuario.ADMIN } })
      .then((admins) => {
        const novaData = new Date(dataPreferida).toLocaleDateString('pt-PT');
        const nomeDoador = agendamento.usuario?.nome ?? 'Doador';
        return notificacaoServico.criarEmMassa({
          idsDestinatarios: admins.map((a) => a.id),
          titulo: 'Pedido de Reagendamento',
          mensagem: `${nomeDoador} solicitou o reagendamento da sua doação para ${novaData}. Aguarda a sua aprovação.`,
          tipo: TipoNotificacao.NOTIFICACAO_ADMIN,
        });
      })
      .catch(() => {});
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/agendamentos-doacao/:id/aprovar-reagendamento - ADMIN
roteador.patch('/:id/aprovar-reagendamento', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await agendamentoDoacaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar agendamento de outro hemocentro' });
      }
    }
    const agendamento = await agendamentoDoacaoServico.aprovarReagendamento(id);
    res.json(agendamento);

    const idDoador = agendamento.usuario?.id;
    if (idDoador) {
      const novaData = new Date(agendamento.dataPreferida).toLocaleDateString('pt-PT');
      notificacaoServico.criar({
        idDestinatario: idDoador,
        titulo: 'Reagendamento Aprovado',
        mensagem: `O seu pedido de reagendamento foi aprovado. Nova data: ${novaData}. O agendamento aguarda aprovação final.`,
        tipo: TipoNotificacao.CONSULTA_AGENDADA,
        tipoEntidadeRelacionada: 'agendamento',
        idEntidadeRelacionada: agendamento.id,
      }).catch(() => {});
    }
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/agendamentos-doacao/:id/rejeitar-reagendamento - ADMIN
roteador.patch('/:id/rejeitar-reagendamento', autenticacaoIntermediario, exigirPerfil(PerfilUsuario.COORDENADOR_HEMOCENTRO, PerfilUsuario.TECNICO_HEMOCENTRO), async (req, res: Response) => {
  try {
    const usuarioLogado = (req as any).usuario;
    const id = Number(req.params.id);
    if ((usuarioLogado?.perfil === PerfilUsuario.COORDENADOR_HEMOCENTRO || usuarioLogado?.perfil === PerfilUsuario.TECNICO_HEMOCENTRO)) {
      const existente = await agendamentoDoacaoServico.buscarPorId(id);
      if (existente?.hemocentro?.id !== usuarioLogado.hemocentroId) {
        return res.status(403).json({ erro: 'Não pode actualizar agendamento de outro hemocentro' });
      }
    }
    const agendamento = await agendamentoDoacaoServico.rejeitarReagendamento(id);
    res.json(agendamento);

    const idDoador = agendamento.usuario?.id;
    if (idDoador) {
      const dataOriginal = new Date(agendamento.dataPreferida).toLocaleDateString('pt-PT');
      notificacaoServico.criar({
        idDestinatario: idDoador,
        titulo: 'Reagendamento Rejeitado',
        mensagem: `O seu pedido de reagendamento não foi aceite. O agendamento original mantém-se para ${dataOriginal}.`,
        tipo: TipoNotificacao.CONSULTA_AGENDADA,
        tipoEntidadeRelacionada: 'agendamento',
        idEntidadeRelacionada: agendamento.id,
      }).catch(() => {});
    }
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

// PATCH /api/v1/agendamentos-doacao/:id/cancelar - próprio utilizador
roteador.patch('/:id/cancelar', autenticacaoIntermediario, async (req: RequisicaoAutenticada, res: Response) => {
  /* #swagger.tags = ['Agendamentos de Doação']
     #swagger.summary = 'Cancelar o meu agendamento'
     #swagger.security = [{ "bearerAuth": [] }]
  */
  try {
    await agendamentoDoacaoServico.cancelar(Number(req.params.id), Number(req.usuario!.sub));
    res.json({ mensagem: 'Agendamento cancelado com sucesso' });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
