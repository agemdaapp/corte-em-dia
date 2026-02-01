import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import availabilityRoutes from './routes/availability.routes'
import appointmentsRoutes from './routes/appointments.routes'
import clientsRoutes from './routes/clients.routes'
import servicesRoutes from './routes/services.routes'

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
)

app.use(express.json())

app.use('/availability', availabilityRoutes)
app.use('/appointments', appointmentsRoutes)
app.use('/clients', clientsRoutes)
app.use('/services', servicesRoutes)

export default app

