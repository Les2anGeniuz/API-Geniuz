import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../services/supabase.js";

const TABLE = "User";
const SALT_ROUNDS = 10;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET missing");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

/* =========================
   REGISTER
========================= */
export async function register(req, res) {
  try {
    const { nama_lengkap = null, email, password } = req.body || {};
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: "Email & password wajib" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter" });
    }

    const { data: exist, error: exErr } = await supabaseAdmin
      .from(TABLE)
      .select("id_User")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (exErr) throw exErr;
    if (exist) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert([{ nama_lengkap, email: cleanEmail, password: hashed }])
      .select("id_User, email, nama_lengkap, created_at")
      .single();

    if (error) throw error;

    const token = signToken({
      id_User: data.id_User,
      email: data.email,
    });

    return res.status(201).json({
      message: "Registrasi berhasil",
      user: data,
      access_token: token,
    });
  } catch (err) {
    console.error("[REGISTER ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =========================
   LOGIN
========================= */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: "Email & password wajib" });
    }

    const { data: user, error } = await supabaseAdmin
      .from(TABLE)
      .select("id_User, email, password, nama_lengkap, created_at")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const token = signToken({
      id_User: user.id_User,
      email: user.email,
    });

    delete user.password;

    return res.status(200).json({
      message: "Login berhasil",
      user,
      access_token: token,
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/* =========================
   ME
========================= */
export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}
