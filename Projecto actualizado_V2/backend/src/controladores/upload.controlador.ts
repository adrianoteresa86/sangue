import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { autenticacaoIntermediario } from '../intermediarios/autenticacao.intermediario';

const roteador = Router();

const armazenamento = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(__dirname, '../../uploads/documentos'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `doc_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, nome);
  },
});

const filtroFicheiro = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const permitidos = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (permitidos.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas ficheiros PDF, JPG ou PNG são permitidos'));
  }
};

const upload = multer({
  storage: armazenamento,
  fileFilter: filtroFicheiro,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// POST /api/v1/uploads/documento
roteador.post('/documento', autenticacaoIntermediario, upload.single('documento'), (req: any, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ erro: 'Nenhum ficheiro enviado' });
      return;
    }
    const url = `/uploads/documentos/${req.file.filename}`;
    res.status(201).json({ url });
  } catch (erro: any) {
    res.status(400).json({ erro: erro.message });
  }
});

export default roteador;
