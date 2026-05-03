import express from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

// ✅ Kayıt
router.post("/register", async (req, res) => {
  const { username, password } = req.body
  const existing = await User.findOne({ username })
  if (existing) return res.status(400).json({ message: "Kullanıcı adı alınmış" })

  const passwordHash = await bcrypt.hash(password, 10)
  const user = new User({ username, passwordHash })
  await user.save()

  res.json({ message: "Kayıt başarılı" })
})

// ✅ Giriş
router.post("/login", async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ username })
  if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ message: "Şifre hatalı" })

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET)
  res.json({ token, username: user.username })
})

export default router
