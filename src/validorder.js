import express from 'express'
import pool from './config/db.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'

const router = express.Router()

router.put('/api/addDelivery', async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).json({ error: 'Non connecté' })
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const id = decoded.id
    }



})








export default router