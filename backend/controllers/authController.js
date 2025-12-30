import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../services/supabase.js";

const TABLE = "User";
const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const nama_lengkap = req.body?.nama_lengkap ?? null;
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) return res.status(400).json({ error: "Email & password wajib" });
    if (password.length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });

    // cek email exist
    const { data: exist, error: exErr } = await supabaseAdmin
      .from(TABLE)
      .select("id_User")
      .eq("email", email)
      .limit(1);

    if (exErr) return res.status(500).json({ error: exErr.message });
    if (exist && exist.length) return res.status(409).json({ error: "Email sudah terdaftar" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ nama_lengkap, email, password: hashed }])
      .select("id_User, email, nama_lengkap, created_at")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const token = signToken({ id_User: data.id_User, email: data.email });
    return res.status(201).json({
      message: "Registrasi berhasil",
      user: data,
      access_token: token,
    });
  } catch (e) {
    console.error("[REGISTER ERROR]", e);
    return res.status(500).json({ error: e?.message || "Internal server error" });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    // DEBUG: biar tau payload masuk bener apa nggak
    console.log("[LOGIN BODY]", { email, hasPassword: !!password, passLen: password.length });

    if (!email || !password) return res.status(400).json({ error: "Email & password wajib" });

    const { data: user, error } = await supabaseAdmin
      .from(TABLE)
      .select("id_User, email, password, nama_lengkap, created_at")
      .eq("email", email)
      .single();

    // DEBUG: ketemu user atau nggak
    console.log("[LOGIN SELECT]", { found: !!user, error: error?.message || null });

    // untuk keamanan: tetap balikin pesan sama
    if (error || !user) return res.status(401).json({ error: "Email atau password salah" });

    // DEBUG: password field kebaca atau nggak
    console.log("[LOGIN PASSWORD FIELD]", {
      isNull: user.password == null,
      prefix: user.password ? String(user.password).slice(0, 4) : null,
    });

    if (!user.password) {
      // biasanya karena env supabaseAdmin salah (bukan service role) / policy keblok
      console.error("[LOGIN ERROR] Password hash tidak kebaca dari DB.");
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const ok = await bcrypt.compare(password, user.password);

    // DEBUG: bcrypt match?
    console.log("[LOGIN BCRYPT]", { ok });

    if (!ok) return res.status(401).json({ error: "Email atau password salah" });

    const token = signToken({ id_User: user.id_User, email: user.email });

    // jangan bocorin hash
    delete user.password;

    return res.status(200).json({
      message: "Login berhasil",
      user,
      access_token: token,
    });
  } catch (e) {
    console.error("[LOGIN CATCH]", e);
    return res.status(500).json({ error: e?.message || "Internal server error" });
  }
}

// GET /api/auth/me
export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}
