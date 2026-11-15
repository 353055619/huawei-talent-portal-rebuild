import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachUser } from './lib/auth.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import myRoutes from './routes/my.js';
import teachRoutes from './routes/teach.js';
import schoolRoutes from './routes/school.js';
import employerRoutes from './routes/employer.js';
import iascRoutes from './routes/iasc.js';
import onboardingRoutes from './routes/onboarding.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/my', myRoutes);
app.use('/api/teach', teachRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/iasc', iascRoutes);
app.use('/api/onboarding', onboardingRoutes);

// 生产模式：托管前端构建产物
const dist = path.join(__dirname, '../../web/dist');
app.use(express.static(dist));
app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));

// 统一错误出口：给前端可读的信息而非堆栈
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || '服务暂时不可用，请稍后重试' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`talent-portal API listening on :${PORT}`));
