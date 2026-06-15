import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import { dataStore } from './dataStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)

app.get('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

app.get('/api/history', (req: Request, res: Response): void => {
  const startTs = req.query.start ? Number(req.query.start) : undefined;
  const endTs = req.query.end ? Number(req.query.end) : undefined;
  const alerts = dataStore.getAlerts(startTs, endTs);
  res.json({ success: true, data: alerts });
})

app.get('/api/history/:id/replay', (req: Request, res: Response): void => {
  const alert = dataStore.getAlertById(req.params.id);
  if (!alert) {
    res.status(404).json({ success: false, error: 'Alert not found' });
    return;
  }
  res.json({ success: true, data: alert });
})

app.get('/api/config/sensors', (req: Request, res: Response): void => {
  res.json({ success: true, data: dataStore.getSensors() });
})

app.put('/api/config/sensors', (req: Request, res: Response): void => {
  const sensors = req.body;
  if (!Array.isArray(sensors)) {
    res.status(400).json({ success: false, error: 'Invalid sensor data' });
    return;
  }
  dataStore.setSensors(sensors);
  res.json({ success: true, data: dataStore.getSensors() });
})

app.get('/api/config/algorithm', (req: Request, res: Response): void => {
  res.json({ success: true, data: dataStore.getAlgorithm() });
})

app.put('/api/config/algorithm', (req: Request, res: Response): void => {
  const config = req.body;
  if (!config || typeof config !== 'object') {
    res.status(400).json({ success: false, error: 'Invalid algorithm config' });
    return;
  }
  dataStore.setAlgorithm(config);
  res.json({ success: true, data: dataStore.getAlgorithm() });
})

app.get('/api/status', (req: Request, res: Response): void => {
  res.json({ success: true, data: dataStore.getSystemStatus() });
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
