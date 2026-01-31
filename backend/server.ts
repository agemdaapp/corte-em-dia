import app from './src/app'
import { supabase } from './src/lib/supabase'

const PORT = 3000

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('services').select('*').limit(1)

  if (error) {
    return res.status(500).json({
      message: 'Erro ao conectar no Supabase',
      details: error.message,
    })
  }

  return res.json({ status: 'ok', supabase: true })
})

app.listen(PORT)

