import { Router } from 'express';
import publicoControlador from '../controladores/publico.controlador';
import autenticacaoControlador from '../autenticacao/autenticacao.controlador';
import hemocentroControlador from '../controladores/hemocentro.controlador';
import estoqueSangueControlador from '../controladores/estoque-sangue.controlador';
import campanhaControlador from '../controladores/campanha.controlador';
import registroDoacaoControlador from '../controladores/registro-doacao.controlador';
import agendamentoDoacaoControlador from '../controladores/agendamento-doacao.controlador';
import notificacaoControlador from '../controladores/notificacao.controlador';
import adminNotificacaoControlador from '../controladores/admin-notificacao.controlador';
import registroTransfusaoControlador from '../controladores/registro-transfusao.controlador';
import pedidoTransfusaoControlador from '../controladores/pedido-transfusao.controlador';
import doadorControlador from '../controladores/doador.controlador';
import usuarioControlador from '../controladores/usuario.controlador';
import estatisticasControlador from '../controladores/estatisticas.controlador';
import receptorControlador from '../controladores/receptor.controlador';
import testeSangueControlador from '../controladores/teste-sangue.controlador';

const roteador = Router();

roteador.use('/auth', autenticacaoControlador);
roteador.use('/hemocentros', hemocentroControlador);
roteador.use('/estoque-sangue', estoqueSangueControlador);
roteador.use('/campanhas', campanhaControlador);
roteador.use('/registros-doacao', registroDoacaoControlador);
roteador.use('/agendamentos-doacao', agendamentoDoacaoControlador);
roteador.use('/agendamentos', agendamentoDoacaoControlador);
roteador.use('/notificacoes', notificacaoControlador);
roteador.use('/admin/notificacoes', adminNotificacaoControlador);
roteador.use('/registros-transfusao', registroTransfusaoControlador);
roteador.use('/pedidos-transfusao', pedidoTransfusaoControlador);
roteador.use('/doadores', doadorControlador);
roteador.use('/usuarios', usuarioControlador);
roteador.use('/estatisticas', estatisticasControlador);
roteador.use('/receptor', receptorControlador);
roteador.use('/testes-sangue', testeSangueControlador);
roteador.use('/publico', publicoControlador);

export default roteador;
