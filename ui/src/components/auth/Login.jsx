import React, { useState } from 'react'
import styled from 'styled-components'
import { useApp } from '../../contexts/AppContext'
import { Button, Input, Card, Alert } from '../../styles/GlobalStyles'
import { Eye, EyeOff, User, Shield } from 'lucide-react'

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(135deg, #1A0F0A 0%, #2C1810 100%);
`

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  text-align: center;
`

const Title = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 700;
`

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 32px;
  font-size: 16px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const InputGroup = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  color: ${props => props.theme.colors.text};
  font-weight: 500;
  text-align: left;
  font-size: 14px;
`

const PasswordInputContainer = styled.div`
  position: relative;
`

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text};
  }
`

// Componentes de role removidos - agora usa apenas nick do jogador

const RememberMe = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: ${props => props.theme.colors.primary};
  }
  
  label {
    font-size: 14px;
    color: ${props => props.theme.colors.textSecondary};
    cursor: pointer;
  }
`

function Login() {
  const { setCurrentUser, setUserRole } = useApp()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Credenciais do sistema
  const adminPassword = 'f3l1p3'

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Verificar se digitou "admin" no campo username
    if (name === 'username' && value.toLowerCase() === 'admin') {
      setShowAdminPassword(true)
    } else if (name === 'username' && value.toLowerCase() !== 'admin') {
      setShowAdminPassword(false)
      setFormData(prev => ({ ...prev, password: '' })) // Limpar senha se não for admin
    }
    
    // Limpar erro quando usuário começar a digitar
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Simular delay de autenticação
      await new Promise(resolve => setTimeout(resolve, 500))

      const { username, password } = formData
      
      // Verificar se é admin
      if (username.toLowerCase() === 'admin') {
        if (password === adminPassword) {
          // Login admin bem-sucedido
          setCurrentUser('admin')
          setUserRole('admin')
          
          // Salvar no localStorage se "Lembrar-me" estiver marcado
          if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({
              username: 'admin',
              role: 'admin',
              timestamp: Date.now()
            }))
          } else {
            localStorage.removeItem('rememberedUser')
          }
          
          console.log('Login realizado como admin:', username)
        } else {
          setError('Senha de administrador incorreta.')
        }
      } else {
        // Login como jogador (apenas com nick)
        if (username.trim()) {
          setCurrentUser(username)
          setUserRole('player')
          
          // Salvar no localStorage se "Lembrar-me" estiver marcado
          if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({
              username,
              role: 'player',
              timestamp: Date.now()
            }))
          } else {
            localStorage.removeItem('rememberedUser')
          }
          
          console.log('Login realizado como jogador:', username)
        } else {
          setError('Digite seu nick para entrar.')
        }
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
      console.error('Erro no login:', err)
    } finally {
      setLoading(false)
    }
  }

  // Verificar se há usuário lembrado ao carregar
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberedUser')
    if (remembered) {
      try {
        const userData = JSON.parse(remembered)
        // Verificar se não expirou (7 dias)
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - userData.timestamp < sevenDays) {
          setFormData({
            username: userData.username,
            password: ''
          })
          // Se for admin, mostrar campo de senha
          if (userData.username.toLowerCase() === 'admin') {
            setShowAdminPassword(true)
          }
          setRememberMe(true)
        } else {
          localStorage.removeItem('rememberedUser')
        }
      } catch (err) {
        localStorage.removeItem('rememberedUser')
      }
    }
  }, [])

  return (
    <LoginContainer>
      <LoginCard>
        <Title>Sistema de Distribuição</Title>
        <Subtitle>Faça login para acessar o sistema</Subtitle>
        
        {error && (
          <Alert type="error" className="fade-in">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="username">
              <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Nick do Jogador
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Digite seu nick (ou 'admin' para acesso administrativo)"
              required
              autoComplete="username"
            />
          </InputGroup>
          
          {showAdminPassword && (
            <InputGroup>
              <Label htmlFor="password">
                <Shield size={16} style={{ display: 'inline', marginRight: '8px' }} />
                Senha do Administrador
              </Label>
              <PasswordInputContainer>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Digite a senha de administrador"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: '40px' }}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </PasswordToggle>
              </PasswordInputContainer>
            </InputGroup>
          )}
          
          <RememberMe>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">Lembrar-me por 7 dias</label>
          </RememberMe>
          
          <Button
            type="submit"
            disabled={loading || !formData.username || (showAdminPassword && !formData.password)}
            fullWidth
            size="large"
          >
            {loading ? 'Entrando...' : (showAdminPassword ? 'Entrar como Admin' : 'Entrar como Jogador')}
          </Button>
        </Form>
        
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(139, 0, 0, 0.1)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: '#D2B48C', textAlign: 'center' }}>
            💡 <strong>Dica:</strong> Digite "admin" para acessar o painel administrativo
          </p>
        </div>
      </LoginCard>
    </LoginContainer>
  )
}

export default Login