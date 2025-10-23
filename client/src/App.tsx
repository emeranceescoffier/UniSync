import React, { useState } from 'react'
import axios from 'axios'

const API = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:4000'

export default function App() {
    const [token, setToken] = useState<string | null>(null)
    const [email, setEmail] = useState('test@example.com')
    const [password, setPassword] = useState('password')
    const [status, setStatus] = useState('not logged in')

    async function register() {
        try {
            await axios.post(`${API}/auth/register`, { email, password })
            alert('Registered! Now login.')
        } catch (err: any) {
            alert('Register failed: ' + (err.response?.data?.error || err.message))
        }
    }

    async function login() {
        try {
            const r = await axios.post(`${API}/auth/login`, { email, password })
            setToken(r.data.token)
            setStatus('logged in')
        } catch (err: any) {
            alert('Login failed: ' + (err.response?.data?.error || err.message))
        }
    }

    return (
        <div className="app">
            <header className="hero">
                <h1>Universal Sync</h1>
                <p className="tag">Sync & backup your files across devices</p>
            </header>

            <main className="card">
                <div className="form-row">
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email" />
                    <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
                </div>
                <div className="form-row">
                    <button onClick={register}>Register</button>
                    <button onClick={login}>Login</button>
                </div>

                <p>Status: {status}</p>
                {token && <p className="hint">Agent: use this account to sync files. Token in memory.</p>}
            </main>

            <footer className="footer">Built for demo • Upgrade to production for real use</footer>
        </div>
    )
}
