import { supabaseAdmin } from '../services/supabase.js'
import jwt from 'jsonwebtoken'

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log("[ADMIN LOGIN BODY]", { email, hasPassword: !!password, passLen: password ? password.length : 0 });
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const { data: admin, error } = await supabaseAdmin
      .from('Admin')
      .select('id, nama, email, password')
      .eq('email', email)
      .eq('password', password)
      .single()

    console.log("[ADMIN LOGIN SELECT]", { found: !!admin, error: error?.message || null });

    if (error || !admin) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    // Password check is done via query above (not recommended, but keeping as is)
    // If you want to use bcrypt, add check here and log result
    // Example: console.log("[ADMIN LOGIN BCRYPT]", { ok: true/false });

    const token = jwt.sign(
      { adminId: admin.id, role: 'admin' },
      process.env.JWT_SECRET_ADMIN || process.env.JWT_SECRET,
      { expiresIn: '1d' }
    )

    return res.status(200).json({
      message: 'Login success',
      admin: { id: admin.id, nama: admin.nama, email: admin.email },
      token
    })
  } catch (e) {
    console.error("[ADMIN LOGIN ERROR]", e);
    return res.status(500).json({ error: e?.message || 'Internal server error' })
  }
}
